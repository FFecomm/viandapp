-- ViandApp · migración 0017 · Operadora puede cargar pedidos cobrados en efectivo
-- o por transferencia. Esos cobros van directo a caja para que el admin tenga
-- la caja real de Croix (cobros que pasan por fuera de la app).

-- ========================================
-- 1. Ampliar medio_pago en caja_movimientos para incluir 'transferencia'
-- ========================================
ALTER TABLE public.caja_movimientos DROP CONSTRAINT IF EXISTS caja_movimientos_medio_pago_check;
ALTER TABLE public.caja_movimientos
  ADD CONSTRAINT caja_movimientos_medio_pago_check
  CHECK (medio_pago IN ('mercado_pago','efectivo','transferencia'));

-- ========================================
-- 2. fn_cargar_pedido: si forma_pago es efectivo/transferencia, registrar caja
-- (operadora cobra por fuera de la app y necesita que quede en caja)
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
  v_alumno_nombre text;
BEGIN
  SELECT rol INTO v_rol FROM public.usuarios WHERE id = v_usuario_id AND activo = true;

  IF v_rol = 'padre' THEN
    IF NOT public.es_alumno_propio(p_alumno_id) THEN
      RAISE EXCEPTION 'Este alumno no está vinculado a tu cuenta';
    END IF;
    IF p_forma_pago_vianda NOT IN ('credito','a_deber') THEN
      RAISE EXCEPTION 'Sólo podés pagar con crédito a favor o dejar a deber';
    END IF;
  ELSIF v_rol NOT IN ('operadora', 'administrativo', 'encargada') THEN
    RAISE EXCEPTION 'No autorizado para cargar pedidos';
  END IF;

  v_es_agregado := (p_fecha = v_hoy);

  INSERT INTO public.pedidos (
    alumno_id, fecha, menu, observaciones,
    forma_pago_vianda, precio_vianda, es_agregado, cargado_por
  ) VALUES (
    p_alumno_id, p_fecha, p_menu, p_observaciones,
    p_forma_pago_vianda, p_precio_vianda, v_es_agregado, v_usuario_id
  ) RETURNING id INTO v_pedido_id;

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
  ELSIF p_forma_pago_vianda IN ('efectivo','transferencia') THEN
    -- Cobro por fuera de la app: queda registrado en caja para el admin
    SELECT nombre_completo INTO v_alumno_nombre FROM public.alumnos WHERE id = p_alumno_id;
    INSERT INTO public.caja_movimientos (
      tipo, categoria, descripcion, monto, medio_pago,
      pedido_id, alumno_id, registrado_por, fecha
    ) VALUES (
      'ingreso',
      'vianda_' || p_forma_pago_vianda,
      'Vianda ' || p_forma_pago_vianda || ' · ' || COALESCE(v_alumno_nombre, '—') || ' · ' || to_char(p_fecha, 'DD/MM/YYYY'),
      p_precio_vianda, p_forma_pago_vianda,
      v_pedido_id, p_alumno_id, v_usuario_id, v_hoy
    );
  END IF;

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

      IF v_rol = 'padre' AND v_forma_prod NOT IN ('credito','a_deber') THEN
        RAISE EXCEPTION 'Sólo podés pagar productos con crédito o a deber';
      END IF;

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
