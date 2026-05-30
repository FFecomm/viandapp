-- ViandApp · migración 0006 · Módulo Encargada de salón
-- Suma: pedidos.estado, tabla caja_movimientos, RPCs para marcar ausencia,
-- dar vianda extra y cobrar en efectivo.

-- ========================================
-- 1. pedidos.estado
-- ========================================
ALTER TABLE public.pedidos
  ADD COLUMN estado text NOT NULL DEFAULT 'confirmado'
  CHECK (estado IN ('confirmado','cancelado','entregado','ausente_acreditado'));

CREATE INDEX pedidos_estado_idx ON public.pedidos (estado);

-- ========================================
-- 2. caja_movimientos (ingresos en efectivo y referencias a MP)
-- ========================================
CREATE TABLE public.caja_movimientos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL CHECK (tipo IN ('ingreso','egreso')),
  categoria text NOT NULL,
  descripcion text,
  monto numeric(12,2) NOT NULL CHECK (monto >= 0),
  medio_pago text NOT NULL CHECK (medio_pago IN ('mercado_pago','efectivo')),
  pedido_id uuid REFERENCES public.pedidos(id) ON DELETE SET NULL,
  alumno_id uuid REFERENCES public.alumnos(id) ON DELETE SET NULL,
  registrado_por uuid REFERENCES public.usuarios(id),
  fecha date NOT NULL DEFAULT (now() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX caja_movimientos_fecha_idx ON public.caja_movimientos (fecha);
CREATE INDEX caja_movimientos_medio_pago_idx ON public.caja_movimientos (medio_pago);

ALTER TABLE public.caja_movimientos ENABLE ROW LEVEL SECURITY;

-- Staff (operadora, encargada, administrativo) ve todo
CREATE POLICY caja_select ON public.caja_movimientos FOR SELECT
  USING (public.auth_rol() IN ('operadora','encargada','administrativo'));

-- Encargada y administrativo pueden registrar cobros en efectivo
CREATE POLICY caja_staff_insert ON public.caja_movimientos FOR INSERT
  WITH CHECK (public.auth_rol() IN ('encargada','administrativo'));

-- Sólo administrativo borra o edita
CREATE POLICY caja_admin_write ON public.caja_movimientos FOR ALL
  USING (public.auth_rol() = 'administrativo')
  WITH CHECK (public.auth_rol() = 'administrativo');

-- ========================================
-- 3. Helper: próximo día hábil (lunes-viernes) desde una fecha
-- ========================================
CREATE OR REPLACE FUNCTION public._proximo_dia_habil(p_desde date)
RETURNS date
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
  v_d date := p_desde + 1;
  v_dow int;
BEGIN
  LOOP
    v_dow := EXTRACT(DOW FROM v_d)::int;  -- 0=Dom, 6=Sab
    EXIT WHEN v_dow BETWEEN 1 AND 5;
    v_d := v_d + 1;
  END LOOP;
  RETURN v_d;
END;
$$;

-- ========================================
-- 4. fn_marcar_ausencia
--   Marca el pedido como 'ausente_acreditado', revierte el consumo y crea
--   un nuevo pedido para el próximo día hábil con el mismo menú.
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

  -- 1) Cambiar estado del pedido actual
  UPDATE public.pedidos SET estado = 'ausente_acreditado', updated_at = now() WHERE id = p_pedido_id;

  -- 2) Revertir movimientos de crédito del pedido (igual lógica que fn_borrar_pedido,
  --    pero sin borrar el pedido)
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

    ELSIF v_mov.tipo = 'deuda_vianda' THEN
      INSERT INTO public.movimientos_credito (
        alumno_id, tipo, monto, pedido_id, usuario_id, nota
      ) VALUES (
        v_pedido.alumno_id, 'reverso_deuda_vianda', -v_mov.monto,
        p_pedido_id, v_usuario_id, 'Reverso por ausencia'
      );

    ELSIF v_mov.tipo = 'deuda_producto' THEN
      INSERT INTO public.movimientos_credito (
        alumno_id, tipo, monto, pedido_id, pedido_producto_id, usuario_id, nota
      ) VALUES (
        v_pedido.alumno_id, 'reverso_deuda_producto', -v_mov.monto,
        p_pedido_id, v_mov.pedido_producto_id, v_usuario_id, 'Reverso por ausencia'
      );
    END IF;
  END LOOP;

  -- 3) Crear nuevo pedido para el próximo día hábil con el mismo menú
  v_fecha_nueva := public._proximo_dia_habil(v_hoy);
  INSERT INTO public.pedidos (
    alumno_id, fecha, menu, observaciones,
    forma_pago_vianda, precio_vianda, es_agregado, cargado_por, estado
  ) VALUES (
    v_pedido.alumno_id, v_fecha_nueva, v_pedido.menu,
    'Reprogramado por ausencia de ' || v_hoy,
    'credito', v_pedido.precio_vianda, false, v_usuario_id, 'confirmado'
  ) RETURNING id INTO v_nuevo_pedido_id;

  -- 4) Consumir crédito del nuevo pedido (idéntico a fn_cargar_pedido para vianda)
  v_resto := public._consumir_buckets(
    v_pedido.alumno_id, v_pedido.precio_vianda, v_nuevo_pedido_id, NULL,
    'consumo_vianda', v_usuario_id, v_pedido.precio_vianda
  );
  IF v_resto > 0 THEN
    INSERT INTO public.movimientos_credito (
      alumno_id, tipo, monto, precio_vianda_al_momento,
      pedido_id, usuario_id, forma_pago, nota
    ) VALUES (
      v_pedido.alumno_id, 'deuda_vianda', -v_resto, v_pedido.precio_vianda,
      v_nuevo_pedido_id, v_usuario_id, 'a_deber',
      'Crédito insuficiente al reprogramar por ausencia'
    );
  END IF;

  PERFORM public._recalcular_alumno(v_pedido.alumno_id);
  RETURN v_nuevo_pedido_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_marcar_ausencia(uuid) TO authenticated;

-- ========================================
-- 5. fn_dar_vianda_extra
--   La encargada da una vianda extra en el día (no pedida). Si tiene crédito
--   se descuenta; si no, devuelve un sentinel para que la UI redirija a cobro.
-- ========================================
CREATE OR REPLACE FUNCTION public.fn_dar_vianda_extra(
  p_alumno_id uuid,
  p_menu text,
  p_precio_vianda numeric
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_usuario_id uuid := auth.uid();
  v_rol text;
  v_hoy date := (now() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date;
  v_credito numeric;
  v_pedido_id uuid;
  v_resto numeric;
BEGIN
  SELECT rol INTO v_rol FROM public.usuarios WHERE id = v_usuario_id AND activo = true;
  IF v_rol NOT IN ('encargada','administrativo') THEN
    RAISE EXCEPTION 'No autorizado para dar viandas extra';
  END IF;

  SELECT credito_pesos INTO v_credito FROM public.alumnos WHERE id = p_alumno_id;
  IF v_credito IS NULL THEN
    RAISE EXCEPTION 'Alumno no encontrado';
  END IF;

  IF v_credito < p_precio_vianda THEN
    RETURN jsonb_build_object('ok', false, 'motivo', 'sin_credito');
  END IF;

  INSERT INTO public.pedidos (
    alumno_id, fecha, menu, observaciones,
    forma_pago_vianda, precio_vianda, es_agregado, cargado_por, estado
  ) VALUES (
    p_alumno_id, v_hoy, p_menu, 'Vianda extra (sin pedido)',
    'credito', p_precio_vianda, true, v_usuario_id, 'confirmado'
  ) RETURNING id INTO v_pedido_id;

  v_resto := public._consumir_buckets(
    p_alumno_id, p_precio_vianda, v_pedido_id, NULL,
    'consumo_vianda', v_usuario_id, p_precio_vianda
  );
  IF v_resto > 0 THEN
    -- No debería pasar porque verificamos arriba, pero por seguridad: marcamos como deuda.
    INSERT INTO public.movimientos_credito (
      alumno_id, tipo, monto, precio_vianda_al_momento,
      pedido_id, usuario_id, forma_pago, nota
    ) VALUES (
      p_alumno_id, 'deuda_vianda', -v_resto, p_precio_vianda,
      v_pedido_id, v_usuario_id, 'a_deber', 'Vianda extra con crédito insuficiente'
    );
  END IF;

  PERFORM public._recalcular_alumno(p_alumno_id);
  RETURN jsonb_build_object('ok', true, 'pedido_id', v_pedido_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_dar_vianda_extra(uuid, text, numeric) TO authenticated;

-- ========================================
-- 6. fn_cobrar_efectivo
--   Registra un cobro en efectivo en caja_movimientos (no toca créditos, es
--   una vianda pagada en mostrador para un alumno sin saldo).
-- ========================================
CREATE OR REPLACE FUNCTION public.fn_cobrar_efectivo(
  p_alumno_id uuid,
  p_monto numeric,
  p_menu text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_usuario_id uuid := auth.uid();
  v_rol text;
  v_hoy date := (now() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date;
  v_caja_id uuid;
  v_pedido_id uuid;
  v_nombre text;
BEGIN
  SELECT rol INTO v_rol FROM public.usuarios WHERE id = v_usuario_id AND activo = true;
  IF v_rol NOT IN ('encargada','administrativo') THEN
    RAISE EXCEPTION 'No autorizado para registrar cobros';
  END IF;
  IF p_monto <= 0 THEN
    RAISE EXCEPTION 'Monto inválido';
  END IF;

  SELECT nombre_completo INTO v_nombre FROM public.alumnos WHERE id = p_alumno_id;
  IF v_nombre IS NULL THEN
    RAISE EXCEPTION 'Alumno no encontrado';
  END IF;

  -- Si pasaron menú, registramos también el pedido pagado en efectivo
  IF p_menu IS NOT NULL THEN
    INSERT INTO public.pedidos (
      alumno_id, fecha, menu, observaciones,
      forma_pago_vianda, precio_vianda, es_agregado, cargado_por, estado
    ) VALUES (
      p_alumno_id, v_hoy, p_menu, 'Pago en efectivo en mostrador',
      'efectivo', p_monto, true, v_usuario_id, 'confirmado'
    ) RETURNING id INTO v_pedido_id;
  END IF;

  INSERT INTO public.caja_movimientos (
    tipo, categoria, descripcion, monto, medio_pago,
    pedido_id, alumno_id, registrado_por, fecha
  ) VALUES (
    'ingreso', 'vianda_efectivo',
    'Vianda en efectivo · ' || v_nombre,
    p_monto, 'efectivo',
    v_pedido_id, p_alumno_id, v_usuario_id, v_hoy
  ) RETURNING id INTO v_caja_id;

  RETURN v_caja_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_cobrar_efectivo(uuid, numeric, text) TO authenticated;
