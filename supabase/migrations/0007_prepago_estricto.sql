-- ViandApp · migración 0007 · Prepago estricto (alineación con spec)
-- Cambios:
--   1. forma_pago_vianda en pedidos: solo 'credito' o 'efectivo' (sin 'a_deber' ni 'transferencia')
--   2. fn_cargar_pedido: rechaza si no hay saldo (en vez de generar deuda)
--   3. fn_marcar_ausencia: rechaza si no hay saldo para reprogramar
--   4. fn_dar_vianda_extra: ya rechazaba; refuerzo la regla
-- Asume DB sin datos productivos. En producción haría falta migrar primero los
-- pedidos con forma_pago='transferencia' o 'a_deber'.

-- ========================================
-- 1. Restringir forma_pago_vianda en pedidos
-- ========================================
ALTER TABLE public.pedidos
  DROP CONSTRAINT IF EXISTS pedidos_forma_pago_vianda_check;

ALTER TABLE public.pedidos
  ADD CONSTRAINT pedidos_forma_pago_vianda_check
  CHECK (forma_pago_vianda IN ('credito','efectivo'));

-- ========================================
-- 2. fn_cargar_pedido: prepago estricto, sin deuda
-- ========================================
CREATE OR REPLACE FUNCTION public.fn_cargar_pedido(
  p_alumno_id uuid,
  p_fecha date,
  p_menu text,
  p_observaciones text,
  p_forma_pago_vianda text,
  p_precio_vianda numeric,
  p_productos jsonb DEFAULT '[]'::jsonb
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_usuario_id uuid := auth.uid();
  v_rol text;
  v_pedido_id uuid;
  v_pedido_producto_id uuid;
  v_es_agregado boolean;
  v_hoy date := (now() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date;
  v_resto numeric;
  v_credito_disponible numeric;
  v_prod jsonb;
  v_producto_precio numeric;
  v_cantidad integer;
  v_monto_producto numeric;
  v_forma_prod text;
  v_total_a_cobrar_credito numeric := 0;
BEGIN
  SELECT rol INTO v_rol FROM public.usuarios WHERE id = v_usuario_id AND activo = true;

  -- Autorización por rol
  IF v_rol = 'padre' THEN
    IF NOT public.es_alumno_propio(p_alumno_id) THEN
      RAISE EXCEPTION 'Este alumno no está vinculado a tu cuenta';
    END IF;
    IF p_forma_pago_vianda <> 'credito' THEN
      RAISE EXCEPTION 'Las familias solo pueden pagar con crédito';
    END IF;
  ELSIF v_rol NOT IN ('operadora','encargada','administrativo') THEN
    RAISE EXCEPTION 'No autorizado para cargar pedidos';
  END IF;

  -- Validación spec: solo crédito o efectivo
  IF p_forma_pago_vianda NOT IN ('credito','efectivo') THEN
    RAISE EXCEPTION 'Forma de pago inválida: %', p_forma_pago_vianda;
  END IF;

  -- PREPAGO ESTRICTO: si va con crédito, verificar que alcance para la vianda
  -- + productos pagados con crédito ANTES de insertar nada.
  IF p_forma_pago_vianda = 'credito' THEN
    v_total_a_cobrar_credito := p_precio_vianda;
  END IF;
  IF jsonb_array_length(p_productos) > 0 THEN
    FOR v_prod IN SELECT * FROM jsonb_array_elements(p_productos)
    LOOP
      v_forma_prod := COALESCE(v_prod->>'forma_pago', p_forma_pago_vianda);
      IF v_forma_prod NOT IN ('credito','efectivo') THEN
        RAISE EXCEPTION 'Forma de pago de producto inválida: %', v_forma_prod;
      END IF;
      IF v_forma_prod = 'credito' THEN
        SELECT precio INTO v_producto_precio
          FROM public.productos WHERE id = (v_prod->>'producto_id')::uuid;
        IF v_producto_precio IS NULL THEN
          RAISE EXCEPTION 'Producto no encontrado: %', v_prod->>'producto_id';
        END IF;
        v_cantidad := COALESCE((v_prod->>'cantidad')::int, 1);
        v_total_a_cobrar_credito := v_total_a_cobrar_credito + (v_producto_precio * v_cantidad);
      END IF;
    END LOOP;
  END IF;

  IF v_total_a_cobrar_credito > 0 THEN
    SELECT credito_pesos INTO v_credito_disponible FROM public.alumnos WHERE id = p_alumno_id FOR UPDATE;
    IF v_credito_disponible IS NULL THEN
      RAISE EXCEPTION 'Alumno no encontrado';
    END IF;
    IF v_credito_disponible < v_total_a_cobrar_credito THEN
      RAISE EXCEPTION 'Saldo insuficiente para confirmar el pedido (prepago estricto)';
    END IF;
  END IF;

  v_es_agregado := (p_fecha = v_hoy);

  INSERT INTO public.pedidos (
    alumno_id, fecha, menu, observaciones,
    forma_pago_vianda, precio_vianda, es_agregado, cargado_por
  ) VALUES (
    p_alumno_id, p_fecha, p_menu, p_observaciones,
    p_forma_pago_vianda, p_precio_vianda, v_es_agregado, v_usuario_id
  ) RETURNING id INTO v_pedido_id;

  -- Vianda
  IF p_forma_pago_vianda = 'credito' THEN
    v_resto := public._consumir_buckets(
      p_alumno_id, p_precio_vianda, v_pedido_id, NULL,
      'consumo_vianda', v_usuario_id, p_precio_vianda
    );
    IF v_resto > 0 THEN
      -- No debería pasar (validamos arriba), pero por seguridad: revertir.
      RAISE EXCEPTION 'Inconsistencia: saldo desapareció entre validación y consumo';
    END IF;
  END IF;
  -- 'efectivo': no afecta crédito. Si es vianda en mostrador, lo registra el caller en caja.

  -- Productos
  IF jsonb_array_length(p_productos) > 0 THEN
    FOR v_prod IN SELECT * FROM jsonb_array_elements(p_productos)
    LOOP
      SELECT precio INTO v_producto_precio
        FROM public.productos WHERE id = (v_prod->>'producto_id')::uuid;
      v_cantidad := COALESCE((v_prod->>'cantidad')::int, 1);
      v_monto_producto := v_producto_precio * v_cantidad;
      v_forma_prod := COALESCE(v_prod->>'forma_pago', p_forma_pago_vianda);

      INSERT INTO public.pedido_productos (
        pedido_id, producto_id, cantidad, precio_al_momento, forma_pago
      ) VALUES (
        v_pedido_id, (v_prod->>'producto_id')::uuid, v_cantidad,
        v_producto_precio, v_forma_prod
      ) RETURNING id INTO v_pedido_producto_id;

      IF v_forma_prod = 'credito' THEN
        v_resto := public._consumir_buckets(
          p_alumno_id, v_monto_producto, v_pedido_id, v_pedido_producto_id,
          'consumo_producto', v_usuario_id, p_precio_vianda
        );
        IF v_resto > 0 THEN
          RAISE EXCEPTION 'Inconsistencia: saldo desapareció entre validación y consumo de producto';
        END IF;
      END IF;
    END LOOP;
  END IF;

  PERFORM public._recalcular_alumno(p_alumno_id);
  RETURN v_pedido_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_cargar_pedido(uuid, date, text, text, text, numeric, jsonb) TO authenticated;

-- ========================================
-- 3. fn_marcar_ausencia: rechaza si no hay saldo para reprogramar
-- ========================================
CREATE OR REPLACE FUNCTION public.fn_marcar_ausencia(p_pedido_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_usuario_id uuid := auth.uid();
  v_rol text;
  v_hoy date := (now() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date;
  v_pedido record;
  v_nuevo_pedido_id uuid;
  v_fecha_nueva date;
  v_resto numeric;
  v_mov record;
  v_credito numeric;
BEGIN
  SELECT rol INTO v_rol FROM public.usuarios WHERE id = v_usuario_id AND activo = true;
  IF v_rol NOT IN ('encargada','administrativo') THEN
    RAISE EXCEPTION 'No autorizado para marcar ausencias';
  END IF;

  SELECT id, alumno_id, fecha, menu, precio_vianda, forma_pago_vianda, estado
    INTO v_pedido
    FROM public.pedidos WHERE id = p_pedido_id;
  IF v_pedido.id IS NULL THEN
    RAISE EXCEPTION 'Pedido no encontrado';
  END IF;
  IF v_pedido.fecha <> v_hoy THEN
    RAISE EXCEPTION 'Solo se pueden marcar ausencias del día de hoy';
  END IF;
  IF v_pedido.estado <> 'confirmado' THEN
    RAISE EXCEPTION 'El pedido ya está en estado %', v_pedido.estado;
  END IF;

  UPDATE public.pedidos SET estado = 'ausente_acreditado', updated_at = now() WHERE id = p_pedido_id;

  -- Reverso del consumo del pedido original
  FOR v_mov IN
    SELECT id, tipo, monto, bucket_id, pedido_producto_id
      FROM public.movimientos_credito
     WHERE pedido_id = p_pedido_id
     ORDER BY created_at DESC
  LOOP
    IF v_mov.tipo IN ('consumo_vianda','consumo_producto') THEN
      IF v_mov.bucket_id IS NOT NULL THEN
        UPDATE public.creditos_buckets
           SET pesos_restantes = pesos_restantes + (-v_mov.monto),
               agotado = false
         WHERE id = v_mov.bucket_id;
      END IF;
      INSERT INTO public.movimientos_credito (
        alumno_id, tipo, monto, pedido_id, pedido_producto_id, bucket_id,
        usuario_id, nota
      ) VALUES (
        v_pedido.alumno_id,
        CASE v_mov.tipo
          WHEN 'consumo_vianda'   THEN 'reverso_consumo_vianda'
          WHEN 'consumo_producto' THEN 'reverso_consumo_producto'
        END,
        -v_mov.monto,
        p_pedido_id, v_mov.pedido_producto_id, v_mov.bucket_id,
        v_usuario_id, 'Reverso por ausencia'
      );
    END IF;
  END LOOP;

  v_fecha_nueva := public._proximo_dia_habil(v_hoy);

  -- Validar saldo antes de crear el nuevo pedido (prepago estricto)
  SELECT credito_pesos INTO v_credito FROM public.alumnos WHERE id = v_pedido.alumno_id FOR UPDATE;
  IF v_credito < v_pedido.precio_vianda THEN
    RAISE EXCEPTION 'Saldo insuficiente para reprogramar la vianda al %', v_fecha_nueva;
  END IF;

  INSERT INTO public.pedidos (
    alumno_id, fecha, menu, observaciones,
    forma_pago_vianda, precio_vianda, es_agregado, cargado_por, estado
  ) VALUES (
    v_pedido.alumno_id, v_fecha_nueva, v_pedido.menu,
    'Reprogramado por ausencia de ' || v_hoy,
    'credito', v_pedido.precio_vianda, false, v_usuario_id, 'confirmado'
  ) RETURNING id INTO v_nuevo_pedido_id;

  v_resto := public._consumir_buckets(
    v_pedido.alumno_id, v_pedido.precio_vianda, v_nuevo_pedido_id, NULL,
    'consumo_vianda', v_usuario_id, v_pedido.precio_vianda
  );
  IF v_resto > 0 THEN
    RAISE EXCEPTION 'Inconsistencia: saldo desapareció entre validación y consumo (ausencia)';
  END IF;

  PERFORM public._recalcular_alumno(v_pedido.alumno_id);
  RETURN v_nuevo_pedido_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_marcar_ausencia(uuid) TO authenticated;

-- ========================================
-- 4. fn_dar_vianda_extra ya rechaza sin crédito; refuerzo el mensaje.
--    (No cambia su comportamiento, lo dejo tal como estaba en 0006.)
-- ========================================
