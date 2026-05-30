-- ViandApp · migración 0011 · Regla de cancelación
-- Un padre NO puede cancelar un pedido si:
--   - la fecha del pedido es la de hoy, Y
--   - ya pasaron las 8:00 AM (hora de Buenos Aires).
-- Staff (operadora, encargada, administrativo) sí puede sin restricción.

CREATE OR REPLACE FUNCTION public.fn_borrar_pedido(p_pedido_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_usuario_id uuid := auth.uid();
  v_rol text;
  v_alumno_id uuid;
  v_fecha date;
  v_estado text;
  v_ahora timestamptz := now();
  v_hoy_ar date := (v_ahora AT TIME ZONE 'America/Argentina/Buenos_Aires')::date;
  v_hora_ar time := (v_ahora AT TIME ZONE 'America/Argentina/Buenos_Aires')::time;
  v_mov record;
BEGIN
  SELECT rol INTO v_rol FROM public.usuarios WHERE id = v_usuario_id AND activo = true;

  SELECT alumno_id, fecha, estado
    INTO v_alumno_id, v_fecha, v_estado
    FROM public.pedidos WHERE id = p_pedido_id;
  IF v_alumno_id IS NULL THEN
    RAISE EXCEPTION 'Pedido no encontrado: %', p_pedido_id;
  END IF;

  IF v_rol = 'padre' THEN
    IF NOT public.es_alumno_propio(v_alumno_id) THEN
      RAISE EXCEPTION 'Este pedido no es de un alumno tuyo';
    END IF;
    -- Regla 8am
    IF v_fecha < v_hoy_ar THEN
      RAISE EXCEPTION 'No se pueden cancelar pedidos de días pasados';
    END IF;
    IF v_fecha = v_hoy_ar AND v_hora_ar >= time '08:00' THEN
      RAISE EXCEPTION 'No podés cancelar el pedido después de las 8:00 del día de la vianda';
    END IF;
    IF v_estado <> 'confirmado' THEN
      RAISE EXCEPTION 'El pedido ya está en estado %', v_estado;
    END IF;
  ELSIF v_rol NOT IN ('operadora','encargada','administrativo') THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  -- Reverso de movimientos
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
        v_usuario_id, 'Reverso por cancelación'
      );

    ELSIF v_mov.tipo = 'deuda_vianda' THEN
      INSERT INTO public.movimientos_credito (
        alumno_id, tipo, monto, pedido_id, usuario_id, nota
      ) VALUES (
        v_alumno_id, 'reverso_deuda_vianda', -v_mov.monto,
        p_pedido_id, v_usuario_id, 'Reverso por cancelación'
      );

    ELSIF v_mov.tipo = 'deuda_producto' THEN
      INSERT INTO public.movimientos_credito (
        alumno_id, tipo, monto, pedido_id, pedido_producto_id, usuario_id, nota
      ) VALUES (
        v_alumno_id, 'reverso_deuda_producto', -v_mov.monto,
        p_pedido_id, v_mov.pedido_producto_id, v_usuario_id, 'Reverso por cancelación'
      );
    END IF;
  END LOOP;

  DELETE FROM public.pedidos WHERE id = p_pedido_id;
  PERFORM public._recalcular_alumno(v_alumno_id);
END;
$$;
