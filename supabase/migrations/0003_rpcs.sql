-- ViandApp · migración 0003 · RPCs (lógica FIFO + cargar/borrar pedido + carga de crédito)
-- Todas las RPCs son SECURITY DEFINER y validan el rol del invocante.

-- ========================================
-- _consumir_buckets — INTERNAL
--   Descuenta `p_monto` en pesos del bucket más viejo no agotado.
--   Si no alcanza, cascadea al siguiente. Inserta un movimiento por cada bucket tocado.
--   Devuelve el monto NO consumido (si quedó algo, ese es el faltante → deuda).
--   Usa SELECT ... FOR UPDATE para evitar race conditions entre dos consumos concurrentes.
-- ========================================
CREATE OR REPLACE FUNCTION public._consumir_buckets(
  p_alumno_id uuid,
  p_monto numeric,
  p_pedido_id uuid,
  p_pedido_producto_id uuid,
  p_tipo_movimiento text,
  p_usuario_id uuid,
  p_precio_vianda_al_momento numeric DEFAULT NULL
) RETURNS numeric
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_bucket record;
  v_a_consumir numeric := p_monto;
  v_consumir_de_bucket numeric;
BEGIN
  IF v_a_consumir <= 0 THEN
    RETURN 0;
  END IF;

  FOR v_bucket IN
    SELECT id, pesos_restantes
      FROM public.creditos_buckets
     WHERE alumno_id = p_alumno_id
       AND NOT agotado
     ORDER BY created_at ASC
     FOR UPDATE
  LOOP
    EXIT WHEN v_a_consumir <= 0;

    v_consumir_de_bucket := LEAST(v_bucket.pesos_restantes, v_a_consumir);

    UPDATE public.creditos_buckets
       SET pesos_restantes = pesos_restantes - v_consumir_de_bucket,
           agotado = ((pesos_restantes - v_consumir_de_bucket) <= 0)
     WHERE id = v_bucket.id;

    INSERT INTO public.movimientos_credito (
      alumno_id, tipo, monto,
      pedido_id, pedido_producto_id, bucket_id,
      usuario_id, precio_vianda_al_momento
    ) VALUES (
      p_alumno_id, p_tipo_movimiento, -v_consumir_de_bucket,
      p_pedido_id, p_pedido_producto_id, v_bucket.id,
      p_usuario_id, p_precio_vianda_al_momento
    );

    v_a_consumir := v_a_consumir - v_consumir_de_bucket;
  END LOOP;

  RETURN v_a_consumir;
END;
$$;

-- ========================================
-- _cancelar_deuda — INTERNAL
--   Si el alumno tiene deuda (credito_pesos < 0), aplica `p_monto` para cancelarla.
--   Devuelve el monto sobrante (el que va a un bucket de crédito nuevo).
-- ========================================
CREATE OR REPLACE FUNCTION public._cancelar_deuda(
  p_alumno_id uuid,
  p_monto numeric,
  p_usuario_id uuid,
  p_forma_pago text
) RETURNS numeric
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_deuda numeric;
  v_cancelar numeric;
BEGIN
  SELECT GREATEST(-credito_pesos, 0) INTO v_deuda
    FROM public.alumnos
   WHERE id = p_alumno_id
   FOR UPDATE;

  v_cancelar := LEAST(p_monto, v_deuda);

  IF v_cancelar > 0 THEN
    INSERT INTO public.movimientos_credito (
      alumno_id, tipo, monto, forma_pago, usuario_id
    ) VALUES (
      p_alumno_id, 'cancelacion_deuda', v_cancelar, p_forma_pago, p_usuario_id
    );
  END IF;

  RETURN p_monto - v_cancelar;
END;
$$;

-- ========================================
-- _recalcular_alumno — INTERNAL
--   Recalcula credito_pesos (suma de todos los movimientos) y viandas_credito
--   (suma de viandas enteras restantes en buckets activos).
-- ========================================
CREATE OR REPLACE FUNCTION public._recalcular_alumno(p_alumno_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.alumnos
     SET credito_pesos = COALESCE((
           SELECT SUM(monto) FROM public.movimientos_credito WHERE alumno_id = p_alumno_id
         ), 0),
         viandas_credito = COALESCE((
           SELECT SUM(FLOOR(pesos_restantes / NULLIF(precio_vianda, 0)))::int
             FROM public.creditos_buckets
            WHERE alumno_id = p_alumno_id AND NOT agotado
         ), 0)
   WHERE id = p_alumno_id;
END;
$$;

-- ========================================
-- fn_cargar_credito — PUBLIC (Administrativo)
--   Registra un pago de un padre. Si hay deuda, primero la cancela; el resto va a un bucket.
-- ========================================
CREATE OR REPLACE FUNCTION public.fn_cargar_credito(
  p_alumno_id uuid,
  p_monto numeric,
  p_precio_vianda numeric,
  p_forma_pago text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_usuario_id uuid := auth.uid();
  v_rol text;
  v_movimiento_id uuid;
  v_bucket_id uuid;
  v_restante numeric;
  v_viandas integer;
BEGIN
  SELECT rol INTO v_rol FROM public.usuarios WHERE id = v_usuario_id AND activo = true;
  IF v_rol IS DISTINCT FROM 'administrativo' THEN
    RAISE EXCEPTION 'Solo el Administrativo puede cargar pagos';
  END IF;

  IF p_monto <= 0 THEN
    RAISE EXCEPTION 'El monto debe ser positivo';
  END IF;
  IF p_precio_vianda <= 0 THEN
    RAISE EXCEPTION 'El precio de vianda debe ser positivo';
  END IF;
  IF p_forma_pago NOT IN ('transferencia','efectivo') THEN
    RAISE EXCEPTION 'Forma de pago inválida para una carga: %', p_forma_pago;
  END IF;

  -- 1. Cancelar deuda existente si la hay
  v_restante := public._cancelar_deuda(p_alumno_id, p_monto, v_usuario_id, p_forma_pago);

  -- 2. Si sobra, crear bucket + movimiento de carga
  IF v_restante > 0 THEN
    v_viandas := FLOOR(v_restante / p_precio_vianda);

    INSERT INTO public.movimientos_credito (
      alumno_id, tipo, monto, precio_vianda_al_momento, viandas_equivalentes,
      forma_pago, usuario_id
    ) VALUES (
      p_alumno_id, 'carga', v_restante, p_precio_vianda, v_viandas,
      p_forma_pago, v_usuario_id
    ) RETURNING id INTO v_movimiento_id;

    INSERT INTO public.creditos_buckets (
      alumno_id, movimiento_carga_id, precio_vianda, pesos_restantes
    ) VALUES (
      p_alumno_id, v_movimiento_id, p_precio_vianda, v_restante
    ) RETURNING id INTO v_bucket_id;

    UPDATE public.movimientos_credito SET bucket_id = v_bucket_id WHERE id = v_movimiento_id;
  END IF;

  PERFORM public._recalcular_alumno(p_alumno_id);
  RETURN v_movimiento_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_cargar_credito(uuid, numeric, numeric, text) TO authenticated;

-- ========================================
-- fn_cargar_pedido — PUBLIC (Operadora)
--   Crea el pedido, aplica lógica de pago de vianda + productos, calcula es_agregado.
--   p_productos = jsonb array de objetos: [{producto_id, cantidad, forma_pago}]
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
  v_prod jsonb;
  v_producto_precio numeric;
  v_cantidad integer;
  v_monto_producto numeric;
  v_forma_prod text;
BEGIN
  SELECT rol INTO v_rol FROM public.usuarios WHERE id = v_usuario_id AND activo = true;
  IF v_rol IS DISTINCT FROM 'operadora' THEN
    RAISE EXCEPTION 'Solo la Operadora puede cargar pedidos';
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
      INSERT INTO public.movimientos_credito (
        alumno_id, tipo, monto, precio_vianda_al_momento,
        pedido_id, usuario_id, forma_pago, nota
      ) VALUES (
        p_alumno_id, 'deuda_vianda', -v_resto, p_precio_vianda,
        v_pedido_id, v_usuario_id, 'a_deber',
        'Crédito insuficiente al consumir vianda; diferencia generada como deuda'
      );
    END IF;
  ELSIF p_forma_pago_vianda = 'a_deber' THEN
    INSERT INTO public.movimientos_credito (
      alumno_id, tipo, monto, precio_vianda_al_momento,
      pedido_id, usuario_id, forma_pago
    ) VALUES (
      p_alumno_id, 'deuda_vianda', -p_precio_vianda, p_precio_vianda,
      v_pedido_id, v_usuario_id, 'a_deber'
    );
  END IF;
  -- 'transferencia' y 'efectivo': no afectan crédito; quedan registrados solo en la fila del pedido.

  -- Productos
  IF jsonb_array_length(p_productos) > 0 THEN
    FOR v_prod IN SELECT * FROM jsonb_array_elements(p_productos)
    LOOP
      SELECT precio INTO v_producto_precio
        FROM public.productos
       WHERE id = (v_prod->>'producto_id')::uuid;
      IF v_producto_precio IS NULL THEN
        RAISE EXCEPTION 'Producto no encontrado: %', v_prod->>'producto_id';
      END IF;

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
          INSERT INTO public.movimientos_credito (
            alumno_id, tipo, monto, pedido_id, pedido_producto_id,
            usuario_id, forma_pago, nota
          ) VALUES (
            p_alumno_id, 'deuda_producto', -v_resto, v_pedido_id, v_pedido_producto_id,
            v_usuario_id, 'a_deber',
            'Crédito insuficiente al consumir producto; diferencia generada como deuda'
          );
        END IF;
      ELSIF v_forma_prod = 'a_deber' THEN
        INSERT INTO public.movimientos_credito (
          alumno_id, tipo, monto, pedido_id, pedido_producto_id,
          usuario_id, forma_pago
        ) VALUES (
          p_alumno_id, 'deuda_producto', -v_monto_producto, v_pedido_id, v_pedido_producto_id,
          v_usuario_id, 'a_deber'
        );
      END IF;
    END LOOP;
  END IF;

  PERFORM public._recalcular_alumno(p_alumno_id);
  RETURN v_pedido_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_cargar_pedido(uuid, date, text, text, text, numeric, jsonb) TO authenticated;

-- ========================================
-- fn_borrar_pedido — PUBLIC (Operadora)
--   Revierte todos los movimientos del pedido y elimina pedido + pedido_productos.
--   Para consumos: restaura pesos al bucket original (reabre `agotado` si hace falta).
--   Para deudas: inserta un movimiento de reverso positivo.
-- ========================================
CREATE OR REPLACE FUNCTION public.fn_borrar_pedido(p_pedido_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_usuario_id uuid := auth.uid();
  v_rol text;
  v_alumno_id uuid;
  v_mov record;
BEGIN
  SELECT rol INTO v_rol FROM public.usuarios WHERE id = v_usuario_id AND activo = true;
  IF v_rol IS DISTINCT FROM 'operadora' THEN
    RAISE EXCEPTION 'Solo la Operadora puede borrar pedidos';
  END IF;

  SELECT alumno_id INTO v_alumno_id FROM public.pedidos WHERE id = p_pedido_id;
  IF v_alumno_id IS NULL THEN
    RAISE EXCEPTION 'Pedido no encontrado: %', p_pedido_id;
  END IF;

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
        v_alumno_id,
        CASE v_mov.tipo
          WHEN 'consumo_vianda'   THEN 'reverso_consumo_vianda'
          WHEN 'consumo_producto' THEN 'reverso_consumo_producto'
        END,
        -v_mov.monto,
        p_pedido_id, v_mov.pedido_producto_id, v_mov.bucket_id,
        v_usuario_id, 'Reverso por borrado de pedido'
      );

    ELSIF v_mov.tipo = 'deuda_vianda' THEN
      INSERT INTO public.movimientos_credito (
        alumno_id, tipo, monto, pedido_id, usuario_id, nota
      ) VALUES (
        v_alumno_id, 'reverso_deuda_vianda', -v_mov.monto,
        p_pedido_id, v_usuario_id, 'Reverso por borrado de pedido'
      );

    ELSIF v_mov.tipo = 'deuda_producto' THEN
      INSERT INTO public.movimientos_credito (
        alumno_id, tipo, monto, pedido_id, pedido_producto_id, usuario_id, nota
      ) VALUES (
        v_alumno_id, 'reverso_deuda_producto', -v_mov.monto,
        p_pedido_id, v_mov.pedido_producto_id, v_usuario_id, 'Reverso por borrado de pedido'
      );
    END IF;
  END LOOP;

  -- Borrar pedido (cascade a pedido_productos). Los movimientos de reverso quedan
  -- con pedido_id apuntando al UUID viejo, que tras DELETE se setea NULL por la FK.
  DELETE FROM public.pedidos WHERE id = p_pedido_id;

  PERFORM public._recalcular_alumno(v_alumno_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_borrar_pedido(uuid) TO authenticated;

-- ========================================
-- fn_crear_perfil_usuario — PUBLIC (Administrativo)
--   Crea el registro en `usuarios` para un auth.users que ya existe.
--   Usar después de crear la cuenta de auth desde una API route con service-role.
-- ========================================
CREATE OR REPLACE FUNCTION public.fn_crear_perfil_usuario(
  p_user_id uuid,
  p_nombre text,
  p_rol text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_rol_invocante text;
BEGIN
  SELECT rol INTO v_rol_invocante FROM public.usuarios WHERE id = auth.uid() AND activo = true;
  IF v_rol_invocante IS DISTINCT FROM 'administrativo' THEN
    RAISE EXCEPTION 'Solo el Administrativo puede crear perfiles';
  END IF;
  IF p_rol NOT IN ('operadora','encargada','administrativo') THEN
    RAISE EXCEPTION 'Rol inválido: %', p_rol;
  END IF;
  INSERT INTO public.usuarios (id, nombre, rol) VALUES (p_user_id, p_nombre, p_rol);
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_crear_perfil_usuario(uuid, text, text) TO authenticated;
