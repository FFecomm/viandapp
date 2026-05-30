-- ViandApp · migración 0010 · Suscripciones Web Push
-- Una fila por suscripción (un usuario puede tener varias: móvil, desktop, etc.)

CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (endpoint)
);

CREATE INDEX push_subscriptions_usuario_idx ON public.push_subscriptions (usuario_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY push_select ON public.push_subscriptions FOR SELECT
  USING (usuario_id = auth.uid() OR public.auth_rol() IN ('operadora','encargada','administrativo'));

CREATE POLICY push_insert ON public.push_subscriptions FOR INSERT
  WITH CHECK (usuario_id = auth.uid());

CREATE POLICY push_delete ON public.push_subscriptions FOR DELETE
  USING (usuario_id = auth.uid());
