-- ViandApp · migración 0013 · OAuth de Mercado Pago Marketplace
-- Una fila por colegio conectado. Por ahora tenemos un solo colegio (Croix),
-- pero el modelo soporta multi-tenant a futuro.

CREATE TABLE public.mp_conexion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL DEFAULT 'principal',  -- 'principal' para el singleton inicial
  mp_user_id text NOT NULL,                  -- id del seller en MP
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  public_key text,
  expires_at timestamptz NOT NULL,
  conectado_por uuid REFERENCES public.usuarios(id),
  creado_en timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now(),
  UNIQUE (mp_user_id)
);

ALTER TABLE public.mp_conexion ENABLE ROW LEVEL SECURITY;

-- Solo admin lee y administra
CREATE POLICY mp_conexion_admin ON public.mp_conexion FOR ALL
  USING (public.auth_rol() = 'administrativo')
  WITH CHECK (public.auth_rol() = 'administrativo');

-- ========================================
-- Helper para que el lado server elija la conexión activa
-- (por ahora retorna la única; en multi-tenant se filtrará por colegio).
-- ========================================
CREATE OR REPLACE FUNCTION public.fn_mp_conexion_activa()
RETURNS TABLE (
  id uuid,
  mp_user_id text,
  access_token text,
  refresh_token text,
  public_key text,
  expires_at timestamptz
)
LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT id, mp_user_id, access_token, refresh_token, public_key, expires_at
    FROM public.mp_conexion
   ORDER BY actualizado_en DESC
   LIMIT 1
$$;

-- No GRANT a authenticated: solo se llama con service role desde server actions / API.
