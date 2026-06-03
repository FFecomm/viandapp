-- ViandApp · migración 0014 · Seguridad y robustez pre-lanzamiento
-- 1. UNIQUE parcial en pedidos para evitar duplicados confirmados por alumno+fecha
-- 2. Ampliar mp_status para aceptar 'refunded' / 'charged_back' / 'reversed'
-- 3. fn_revertir_pago_mp: reverso ante contracargo / devolución / cancelación

-- ========================================
-- 1. UNIQUE PARCIAL: un alumno no puede tener dos pedidos confirmados/entregados el mismo día
-- ========================================
-- Limpia eventuales duplicados previos (DB sin datos productivos según CLAUDE.md,
-- pero ejecutamos por idempotencia: deja solo el más antiguo por par alumno+fecha).
DELETE FROM public.pedidos p
USING (
  SELECT alumno_id, fecha, MIN(created_at) AS keep_at
    FROM public.pedidos
   WHERE estado IN ('confirmado','entregado')
   GROUP BY alumno_id, fecha
  HAVING COUNT(*) > 1
) dup
WHERE p.alumno_id = dup.alumno_id
  AND p.fecha = dup.fecha
  AND p.estado IN ('confirmado','entregado')
  AND p.created_at <> dup.keep_at;

CREATE UNIQUE INDEX IF NOT EXISTS pedidos_alumno_fecha_unico_idx
  ON public.pedidos (alumno_id, fecha)
  WHERE estado IN ('confirmado','entregado');

-- ========================================
-- 2. Ampliar el check de mp_status para aceptar estados de reverso de MP
-- ========================================
ALTER TABLE public.pagos
  DROP CONSTRAINT IF EXISTS pagos_mp_status_check;

ALTER TABLE public.pagos
  ADD CONSTRAINT pagos_mp_status_check
  CHECK (mp_status IN (
    'pendiente','approved','rejected','cancelled','in_process',
    'refunded','charged_back'
  ));

-- ========================================
-- 3. fn_revertir_pago_mp
--   Llamada por el webhook (con service_role) cuando MP marca refunded /
--   charged_back / cancelled DESPUÉS de haber estado aprobado.
--   - Revierte el saldo no-consumido del bucket original.
--   - Registra egreso en caja por el monto total revertido (lo que vuelve a MP).
--   - El consumo ya gastado queda como pérdida del negocio (no podemos
--     "des-comer" viandas que el alumno ya consumió). El admin se entera por caja.
--   Idempotente: si ya estaba en estado terminal de reverso, no hace nada.
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

  -- Idempotencia: si ya está en estado de reverso, salir.
  IF v_pago.mp_status IN ('refunded','charged_back','cancelled') THEN
    RETURN;
  END IF;

  -- Si nunca estuvo aprobado (no se acreditó saldo), basta con actualizar el status.
  IF v_pago.mp_status <> 'approved' OR v_pago.acreditado_en IS NULL THEN
    UPDATE public.pagos
       SET mp_status = p_mp_status,
           mp_payment_id = COALESCE(p_mp_payment_id, mp_payment_id),
           actualizado_en = now()
     WHERE id = p_pago_id;
    RETURN;
  END IF;

  -- Estaba acreditado. Buscar el bucket creado por la carga original.
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
    -- Vaciar el bucket no consumido.
    UPDATE public.creditos_buckets
       SET pesos_restantes = 0,
           agotado = true,
           updated_at = now()
     WHERE id = v_bucket.id;

    -- Registrar el movimiento de reverso (negativo) por la parte recuperable.
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

  -- Caja: registrar el egreso por el TOTAL del pago (lo que MP devuelve / quita).
  SELECT nombre_completo INTO v_alumno_nombre FROM public.alumnos WHERE id = v_pago.alumno_id;
  INSERT INTO public.caja_movimientos (
    tipo, categoria, descripcion, monto, medio_pago,
    pedido_id, alumno_id, registrado_por, fecha
  ) VALUES (
    'egreso',
    'reverso_carga_mp',
    'Reverso MP (' || p_mp_status || ') · ' || COALESCE(v_alumno_nombre, '—'),
    v_pago.monto_total, 'mercado_pago',
    NULL, v_pago.alumno_id, v_pago.usuario_id,
    (now() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date
  );

  -- Actualizar el pago.
  UPDATE public.pagos
     SET mp_status = p_mp_status,
         mp_payment_id = COALESCE(p_mp_payment_id, mp_payment_id),
         actualizado_en = now()
   WHERE id = p_pago_id;
END;
$$;

-- No GRANT a authenticated: solo el webhook (service_role) lo llama.

-- ========================================
-- 4. Trigger: bump pedidos.updated_at cuando cambian sus productos
--   Necesario para que el realtime de la operadora (que escucha solo
--   `pedidos` filtrado por fecha) capture también ediciones de productos.
-- ========================================
CREATE OR REPLACE FUNCTION public._bump_pedido_updated_at()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_pedido_id uuid;
BEGIN
  v_pedido_id := COALESCE(NEW.pedido_id, OLD.pedido_id);
  IF v_pedido_id IS NOT NULL THEN
    UPDATE public.pedidos SET updated_at = now() WHERE id = v_pedido_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_pedido_productos_bump ON public.pedido_productos;
CREATE TRIGGER trg_pedido_productos_bump
  AFTER INSERT OR UPDATE OR DELETE ON public.pedido_productos
  FOR EACH ROW EXECUTE FUNCTION public._bump_pedido_updated_at();

-- ========================================
-- 5. Audit log: acciones sensibles del administrativo (alta/baja de usuarios, etc.)
-- ========================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES public.usuarios(id),
  accion text NOT NULL,
  recurso_tipo text NOT NULL,
  recurso_id text,
  detalle jsonb,
  ip text,
  user_agent text,
  creado_en timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_logs_actor_idx ON public.audit_logs (actor_id, creado_en DESC);
CREATE INDEX IF NOT EXISTS audit_logs_recurso_idx ON public.audit_logs (recurso_tipo, recurso_id);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Solo administrativo puede leer el log.
CREATE POLICY audit_logs_select ON public.audit_logs FOR SELECT
  USING (public.auth_rol() = 'administrativo');

-- Escritura solo vía service_role (las API routes lo insertan, no usuarios autenticados).
