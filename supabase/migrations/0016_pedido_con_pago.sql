-- ViandApp · migración 0016 · Pedidos con pago MP integrado
-- Refactor del flujo de familia: el padre elige días + menús en el wizard
-- y paga TODO via MP en un mismo flujo. Los pedidos se crean en estado
-- 'pendiente_pago' y pasan a 'confirmado' cuando el webhook de MP confirma
-- el pago. Si el pago falla / se rechaza / se abandona, los pedidos se
-- cancelan y liberan los días.

-- ========================================
-- 1. Ampliar el check de estado para incluir 'pendiente_pago'
-- ========================================
ALTER TABLE public.pedidos DROP CONSTRAINT IF EXISTS pedidos_estado_check;
ALTER TABLE public.pedidos
  ADD CONSTRAINT pedidos_estado_check
  CHECK (estado IN ('confirmado','cancelado','entregado','ausente_acreditado','pendiente_pago'));

-- ========================================
-- 2. Agregar pago_id a pedidos
-- Vincula el pedido con el pago MP que lo originó. NULL para pedidos creados
-- por el flujo viejo (saldo puro, operadora, encargada).
-- ========================================
ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS pago_id uuid REFERENCES public.pagos(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS pedidos_pago_id_idx
  ON public.pedidos (pago_id) WHERE pago_id IS NOT NULL;

-- ========================================
-- 3. Recrear UNIQUE parcial incluyendo pendiente_pago
-- Un alumno no puede tener dos pedidos no-cancelados en el mismo día.
-- pendiente_pago "reserva" el día mientras el padre completa el checkout.
-- ========================================
DROP INDEX IF EXISTS pedidos_alumno_fecha_unico_idx;
CREATE UNIQUE INDEX pedidos_alumno_fecha_unico_idx
  ON public.pedidos (alumno_id, fecha)
  WHERE estado IN ('confirmado','entregado','pendiente_pago');

-- ========================================
-- 4. fn_iniciar_pedidos_con_pago
-- El padre, al confirmar en el wizard, llama esta función. Crea el pago
-- (estado pendiente) y los pedidos (estado pendiente_pago), todo en una
-- transacción. Devuelve el pago_id para que el server cree la preferencia MP.
-- ========================================
CREATE OR REPLACE FUNCTION public.fn_iniciar_pedidos_con_pago(
  p_alumno_id uuid,
  p_pedidos jsonb,
  p_precio_unitario numeric
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_rol text;
  v_pago_id uuid;
  v_cantidad integer;
  v_pedido jsonb;
  v_fecha date;
  v_menu text;
  v_hoy date := (now() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date;
BEGIN
  -- Auth
  SELECT rol INTO v_rol FROM public.usuarios WHERE id = v_uid AND activo = true;
  IF v_rol <> 'padre' THEN
    RAISE EXCEPTION 'Solo un padre puede iniciar un pedido con pago MP';
  END IF;
  IF NOT public.es_alumno_propio(p_alumno_id) THEN
    RAISE EXCEPTION 'Este alumno no está vinculado a tu cuenta';
  END IF;
  IF p_precio_unitario <= 0 THEN
    RAISE EXCEPTION 'Precio inválido';
  END IF;

  v_cantidad := jsonb_array_length(p_pedidos);
  IF v_cantidad < 1 THEN
    RAISE EXCEPTION 'Tenés que elegir al menos un día';
  END IF;

  -- Limpieza preventiva: liberar pendientes propios > 30min sin webhook
  UPDATE public.pedidos
     SET estado = 'cancelado', updated_at = now()
   WHERE alumno_id = p_alumno_id
     AND estado = 'pendiente_pago'
     AND created_at < now() - interval '30 minutes';

  -- Crear el pago (estado pendiente)
  INSERT INTO public.pagos (
    usuario_id, alumno_id, viandas_compradas, precio_unitario, monto_total
  ) VALUES (
    v_uid, p_alumno_id, v_cantidad, p_precio_unitario, v_cantidad * p_precio_unitario
  ) RETURNING id INTO v_pago_id;

  -- Crear los pedidos en pendiente_pago, vinculados al pago
  FOR v_pedido IN SELECT * FROM jsonb_array_elements(p_pedidos)
  LOOP
    v_fecha := (v_pedido->>'fecha')::date;
    v_menu := v_pedido->>'menu';

    IF v_fecha IS NULL OR v_menu IS NULL THEN
      RAISE EXCEPTION 'Datos de pedido inválidos';
    END IF;
    IF v_menu NOT IN ('A','B','C','Hamburguesa','Fideos','Sandwich') THEN
      RAISE EXCEPTION 'Menú inválido: %', v_menu;
    END IF;

    BEGIN
      INSERT INTO public.pedidos (
        alumno_id, fecha, menu, observaciones,
        forma_pago_vianda, precio_vianda, es_agregado, cargado_por,
        estado, pago_id
      ) VALUES (
        p_alumno_id, v_fecha, v_menu, v_pedido->>'observaciones',
        'credito', p_precio_unitario, (v_fecha = v_hoy), v_uid,
        'pendiente_pago', v_pago_id
      );
    EXCEPTION WHEN unique_violation THEN
      RAISE EXCEPTION 'Ya hay un pedido para %', v_fecha;
    END;
  END LOOP;

  RETURN v_pago_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_iniciar_pedidos_con_pago(uuid, jsonb, numeric) TO authenticated;

-- ========================================
-- 5. fn_acreditar_pago_mp (reemplaza la versión de 0009)
-- Llamada por el webhook con service_role. Lógica:
--   - Si el pago tiene pedidos asociados (pendiente_pago): crea bucket, los
--     confirma uno a uno, y cada pedido consume el bucket.
--   - Si NO tiene pedidos asociados (flujo viejo carga-saldo-puro): crea bucket
--     que queda disponible para futuros pedidos.
--   - Si el estado no es 'approved': cancela los pedidos pendientes si existen.
-- Idempotente.
-- ========================================
CREATE OR REPLACE FUNCTION public.fn_acreditar_pago_mp(
  p_pago_id uuid,
  p_mp_payment_id text,
  p_mp_status text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_pago record;
  v_movimiento_id uuid;
  v_bucket_id uuid;
  v_alumno_nombre text;
  v_tiene_pedidos boolean;
  v_resto numeric;
  v_pedido record;
  v_hoy date := (now() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date;
BEGIN
  SELECT * INTO v_pago FROM public.pagos WHERE id = p_pago_id FOR UPDATE;
  IF v_pago.id IS NULL THEN RAISE EXCEPTION 'Pago no encontrado: %', p_pago_id; END IF;

  -- Idempotencia
  IF v_pago.mp_status = 'approved' AND v_pago.acreditado_en IS NOT NULL THEN
    RETURN;
  END IF;

  UPDATE public.pagos
     SET mp_payment_id = COALESCE(p_mp_payment_id, mp_payment_id),
         mp_status = p_mp_status,
         actualizado_en = now()
   WHERE id = p_pago_id;

  -- ¿Este pago tiene pedidos asociados? (flujo nuevo familia)
  SELECT EXISTS(
    SELECT 1 FROM public.pedidos
     WHERE pago_id = p_pago_id AND estado = 'pendiente_pago'
  ) INTO v_tiene_pedidos;

  -- Estado no aprobado: cancelar pedidos pendientes si los hay y salir
  IF p_mp_status <> 'approved' THEN
    IF v_tiene_pedidos THEN
      UPDATE public.pedidos
         SET estado = 'cancelado', updated_at = now()
       WHERE pago_id = p_pago_id AND estado = 'pendiente_pago';
    END IF;
    RETURN;
  END IF;

  -- APROBADO: crear bucket por el monto total (común a ambos flujos)
  INSERT INTO public.movimientos_credito (
    alumno_id, tipo, monto, precio_vianda_al_momento, viandas_equivalentes,
    forma_pago, usuario_id
  ) VALUES (
    v_pago.alumno_id, 'carga', v_pago.monto_total, v_pago.precio_unitario,
    v_pago.viandas_compradas, 'transferencia', v_pago.usuario_id
  ) RETURNING id INTO v_movimiento_id;

  INSERT INTO public.creditos_buckets (
    alumno_id, movimiento_carga_id, precio_vianda, pesos_restantes
  ) VALUES (
    v_pago.alumno_id, v_movimiento_id, v_pago.precio_unitario, v_pago.monto_total
  ) RETURNING id INTO v_bucket_id;

  UPDATE public.movimientos_credito SET bucket_id = v_bucket_id WHERE id = v_movimiento_id;

  -- Si tiene pedidos asociados, confirmarlos y consumir el bucket
  IF v_tiene_pedidos THEN
    FOR v_pedido IN
      SELECT * FROM public.pedidos
       WHERE pago_id = p_pago_id AND estado = 'pendiente_pago'
       ORDER BY fecha
    LOOP
      UPDATE public.pedidos
         SET estado = 'confirmado', updated_at = now()
       WHERE id = v_pedido.id;

      v_resto := public._consumir_buckets(
        v_pago.alumno_id, v_pago.precio_unitario, v_pedido.id, NULL,
        'consumo_vianda', v_pago.usuario_id, v_pago.precio_unitario
      );
      -- v_resto debería ser 0 (bucket exacto), si no algo está mal
      IF v_resto > 0 THEN
        RAISE EXCEPTION 'Bucket insuficiente al consumir pedido % (resto: %)', v_pedido.id, v_resto;
      END IF;
    END LOOP;
  END IF;

  PERFORM public._recalcular_alumno(v_pago.alumno_id);

  -- Caja: registrar ingreso
  SELECT nombre_completo INTO v_alumno_nombre FROM public.alumnos WHERE id = v_pago.alumno_id;
  INSERT INTO public.caja_movimientos (
    tipo, categoria, descripcion, monto, medio_pago,
    pedido_id, alumno_id, registrado_por, fecha
  ) VALUES (
    'ingreso',
    CASE WHEN v_tiene_pedidos THEN 'pago_vianda_mp' ELSE 'carga_credito_mp' END,
    CASE WHEN v_tiene_pedidos
         THEN 'Pago MP · ' || COALESCE(v_alumno_nombre, '—') || ' · ' || v_pago.viandas_compradas || ' viandas'
         ELSE 'Carga MP · ' || COALESCE(v_alumno_nombre, '—') || ' · ' || v_pago.viandas_compradas || ' viandas'
    END,
    v_pago.monto_total, 'mercado_pago',
    NULL, v_pago.alumno_id, v_pago.usuario_id, v_hoy
  );

  UPDATE public.pagos SET acreditado_en = now() WHERE id = p_pago_id;
END;
$$;

-- ========================================
-- 6. fn_revertir_pago_mp (extender para cancelar pedidos vinculados)
-- Cuando MP reembolsa / cancela DESPUÉS de aprobar, cancelar también los
-- pedidos vinculados al pago (los que aún no se entregaron).
-- ========================================
CREATE OR REPLACE FUNCTION public.fn_revertir_pago_mp(
  p_pago_id uuid,
  p_mp_payment_id text,
  p_mp_status text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_pago record;
  v_bucket record;
  v_alumno_nombre text;
  v_recuperable numeric;
BEGIN
  IF p_mp_status NOT IN ('refunded','charged_back','cancelled') THEN
    RAISE EXCEPTION 'Estado de reverso inválido: %', p_mp_status;
  END IF;

  SELECT * INTO v_pago FROM public.pagos WHERE id = p_pago_id FOR UPDATE;
  IF v_pago.id IS NULL THEN RAISE EXCEPTION 'Pago no encontrado: %', p_pago_id; END IF;

  IF v_pago.mp_status IN ('refunded','charged_back','cancelled') THEN
    RETURN;
  END IF;

  -- Si nunca estuvo aprobado, basta con actualizar el status y cancelar pedidos pendientes
  IF v_pago.mp_status <> 'approved' OR v_pago.acreditado_en IS NULL THEN
    UPDATE public.pedidos
       SET estado = 'cancelado', updated_at = now()
     WHERE pago_id = p_pago_id AND estado = 'pendiente_pago';

    UPDATE public.pagos
       SET mp_status = p_mp_status,
           mp_payment_id = COALESCE(p_mp_payment_id, mp_payment_id),
           actualizado_en = now()
     WHERE id = p_pago_id;
    RETURN;
  END IF;

  -- Estaba acreditado. Cancelar pedidos confirmados no-entregados vinculados al pago.
  -- Los entregados quedan (la vianda ya se consumió, pérdida del negocio).
  UPDATE public.pedidos
     SET estado = 'cancelado', updated_at = now()
   WHERE pago_id = p_pago_id AND estado = 'confirmado';

  -- Buscar el bucket creado por la carga original.
  SELECT b.* INTO v_bucket
    FROM public.creditos_buckets b
    JOIN public.movimientos_credito m ON m.bucket_id = b.id
   WHERE m.alumno_id = v_pago.alumno_id
     AND m.tipo = 'carga'
     AND m.monto = v_pago.monto_total
   ORDER BY b.created_at DESC
   LIMIT 1
  FOR UPDATE;

  IF v_bucket.id IS NOT NULL THEN
    v_recuperable := GREATEST(v_bucket.pesos_restantes, 0);
    UPDATE public.creditos_buckets
       SET pesos_restantes = 0, agotado = true, updated_at = now()
     WHERE id = v_bucket.id;

    IF v_recuperable > 0 THEN
      INSERT INTO public.movimientos_credito (
        alumno_id, tipo, monto, bucket_id, usuario_id, nota
      ) VALUES (
        v_pago.alumno_id, 'reverso_carga', -v_recuperable, v_bucket.id,
        v_pago.usuario_id,
        'Reverso por ' || p_mp_status || ' (pago_id=' || p_pago_id::text || ')'
      );
    END IF;
  END IF;

  PERFORM public._recalcular_alumno(v_pago.alumno_id);

  SELECT nombre_completo INTO v_alumno_nombre FROM public.alumnos WHERE id = v_pago.alumno_id;
  INSERT INTO public.caja_movimientos (
    tipo, categoria, descripcion, monto, medio_pago,
    pedido_id, alumno_id, registrado_por, fecha
  ) VALUES (
    'egreso', 'reverso_carga_mp',
    'Reverso MP (' || p_mp_status || ') · ' || COALESCE(v_alumno_nombre, '—'),
    v_pago.monto_total, 'mercado_pago',
    NULL, v_pago.alumno_id, v_pago.usuario_id,
    (now() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date
  );

  UPDATE public.pagos
     SET mp_status = p_mp_status,
         mp_payment_id = COALESCE(p_mp_payment_id, mp_payment_id),
         actualizado_en = now()
   WHERE id = p_pago_id;
END;
$$;

-- ========================================
-- 7. fn_limpiar_pedidos_pendientes
-- Cancela pedidos en estado pendiente_pago más viejos que 30 minutos.
-- Pensada para llamarse periódicamente (cron) o al inicio del wizard.
-- ========================================
CREATE OR REPLACE FUNCTION public.fn_limpiar_pedidos_pendientes()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_count integer := 0;
BEGIN
  WITH expirados AS (
    UPDATE public.pedidos
       SET estado = 'cancelado', updated_at = now()
     WHERE estado = 'pendiente_pago'
       AND created_at < now() - interval '30 minutes'
    RETURNING id
  )
  SELECT count(*) INTO v_count FROM expirados;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_limpiar_pedidos_pendientes() TO authenticated;
