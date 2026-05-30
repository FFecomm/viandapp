-- ViandApp · migración 0009 · Pagos con Mercado Pago
-- Tabla `pagos` + RPCs para iniciar una preferencia y acreditar viandas
-- cuando el webhook de MP confirma el pago.

CREATE TABLE public.pagos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES public.usuarios(id),
  alumno_id uuid NOT NULL REFERENCES public.alumnos(id),
  viandas_compradas integer NOT NULL CHECK (viandas_compradas > 0),
  precio_unitario numeric(12,2) NOT NULL CHECK (precio_unitario > 0),
  monto_total numeric(12,2) NOT NULL CHECK (monto_total > 0),
  mp_preference_id text,
  mp_payment_id text,
  mp_status text NOT NULL DEFAULT 'pendiente'
    CHECK (mp_status IN ('pendiente','approved','rejected','cancelled','in_process')),
  acreditado_en timestamptz,
  creado_en timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX pagos_usuario_idx ON public.pagos (usuario_id);
CREATE INDEX pagos_alumno_idx ON public.pagos (alumno_id);
CREATE INDEX pagos_mp_payment_id_idx ON public.pagos (mp_payment_id);
CREATE INDEX pagos_mp_preference_id_idx ON public.pagos (mp_preference_id);

ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;

CREATE POLICY pagos_select ON public.pagos FOR SELECT
  USING (
    usuario_id = auth.uid()
    OR public.auth_rol() IN ('operadora','administrativo')
  );

-- ========================================
-- fn_iniciar_pago_mp
--   Crea una fila pendiente y devuelve su id. Llamada por el padre antes
--   de redirigir al Checkout Pro.
-- ========================================
CREATE OR REPLACE FUNCTION public.fn_iniciar_pago_mp(
  p_alumno_id uuid,
  p_viandas integer,
  p_precio_unitario numeric
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_rol text;
  v_pago_id uuid;
BEGIN
  SELECT rol INTO v_rol FROM public.usuarios WHERE id = v_uid AND activo = true;
  IF v_rol <> 'padre' THEN
    RAISE EXCEPTION 'Solo un padre puede iniciar un pago con MP';
  END IF;
  IF NOT public.es_alumno_propio(p_alumno_id) THEN
    RAISE EXCEPTION 'Este alumno no está vinculado a tu cuenta';
  END IF;
  IF p_viandas < 1 THEN
    RAISE EXCEPTION 'Cantidad inválida';
  END IF;
  IF p_precio_unitario <= 0 THEN
    RAISE EXCEPTION 'Precio inválido';
  END IF;

  INSERT INTO public.pagos (
    usuario_id, alumno_id, viandas_compradas, precio_unitario, monto_total
  ) VALUES (
    v_uid, p_alumno_id, p_viandas, p_precio_unitario, p_viandas * p_precio_unitario
  ) RETURNING id INTO v_pago_id;

  RETURN v_pago_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_iniciar_pago_mp(uuid, integer, numeric) TO authenticated;

-- ========================================
-- fn_set_preference_id
--   Asocia el preference_id devuelto por MP a la fila del pago.
-- ========================================
CREATE OR REPLACE FUNCTION public.fn_set_preference_id(
  p_pago_id uuid,
  p_preference_id text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_dueno uuid;
BEGIN
  SELECT usuario_id INTO v_dueno FROM public.pagos WHERE id = p_pago_id;
  IF v_dueno IS NULL THEN RAISE EXCEPTION 'Pago no encontrado'; END IF;
  IF v_dueno <> v_uid THEN RAISE EXCEPTION 'No autorizado'; END IF;
  UPDATE public.pagos
     SET mp_preference_id = p_preference_id, actualizado_en = now()
   WHERE id = p_pago_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_set_preference_id(uuid, text) TO authenticated;

-- ========================================
-- fn_acreditar_pago_mp
--   Llamada por el webhook (con service_role). Si el pago fue aprobado y
--   no estaba acreditado: crea bucket de crédito + movimiento + caja.
--   Idempotente: si ya estaba aprobado, no hace nada.
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
BEGIN
  SELECT * INTO v_pago FROM public.pagos WHERE id = p_pago_id FOR UPDATE;
  IF v_pago.id IS NULL THEN RAISE EXCEPTION 'Pago no encontrado: %', p_pago_id; END IF;

  -- Idempotencia: si ya estaba aprobado y acreditado, salir.
  IF v_pago.mp_status = 'approved' AND v_pago.acreditado_en IS NOT NULL THEN
    RETURN;
  END IF;

  UPDATE public.pagos
     SET mp_payment_id = COALESCE(p_mp_payment_id, mp_payment_id),
         mp_status = p_mp_status,
         actualizado_en = now()
   WHERE id = p_pago_id;

  IF p_mp_status <> 'approved' THEN
    RETURN;
  END IF;

  -- Acreditar: crear bucket + movimiento + entrada de caja
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

  PERFORM public._recalcular_alumno(v_pago.alumno_id);

  SELECT nombre_completo INTO v_alumno_nombre FROM public.alumnos WHERE id = v_pago.alumno_id;
  INSERT INTO public.caja_movimientos (
    tipo, categoria, descripcion, monto, medio_pago,
    pedido_id, alumno_id, registrado_por, fecha
  ) VALUES (
    'ingreso', 'carga_credito_mp',
    'Carga MP · ' || COALESCE(v_alumno_nombre, '—') || ' · ' || v_pago.viandas_compradas || ' viandas',
    v_pago.monto_total, 'mercado_pago',
    NULL, v_pago.alumno_id, v_pago.usuario_id,
    (now() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date
  );

  UPDATE public.pagos SET acreditado_en = now() WHERE id = p_pago_id;
END;
$$;

-- No GRANT a authenticated: solo se llama con service_role desde el webhook.
