-- ViandApp · migración 0002 · RLS + helper de rol

-- ========================================
-- Helper: rol del usuario autenticado
-- ========================================
CREATE OR REPLACE FUNCTION public.auth_rol() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT rol FROM public.usuarios WHERE id = auth.uid() AND activo = true LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.auth_rol() TO authenticated;

-- ========================================
-- Habilitar RLS
-- ========================================
ALTER TABLE public.usuarios            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumnos             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contactos           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedido_productos    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_credito ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creditos_buckets    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_ciclo          ENABLE ROW LEVEL SECURITY;

-- ========================================
-- usuarios: cada uno ve su propia fila; administrativo ve y edita todo
-- ========================================
CREATE POLICY usuarios_select ON public.usuarios FOR SELECT
  USING (auth.uid() = id OR public.auth_rol() = 'administrativo');
CREATE POLICY usuarios_admin_write ON public.usuarios FOR ALL
  USING (public.auth_rol() = 'administrativo')
  WITH CHECK (public.auth_rol() = 'administrativo');

-- ========================================
-- alumnos: todos leen; operadora escribe
-- ========================================
CREATE POLICY alumnos_select ON public.alumnos FOR SELECT USING (true);
CREATE POLICY alumnos_op_insert ON public.alumnos FOR INSERT
  WITH CHECK (public.auth_rol() = 'operadora');
CREATE POLICY alumnos_op_update ON public.alumnos FOR UPDATE
  USING (public.auth_rol() = 'operadora')
  WITH CHECK (public.auth_rol() = 'operadora');

-- ========================================
-- contactos: todos leen; operadora escribe
-- ========================================
CREATE POLICY contactos_select ON public.contactos FOR SELECT USING (true);
CREATE POLICY contactos_op_write ON public.contactos FOR ALL
  USING (public.auth_rol() = 'operadora')
  WITH CHECK (public.auth_rol() = 'operadora');

-- ========================================
-- productos: todos leen; operadora y administrativo escriben
-- ========================================
CREATE POLICY productos_select ON public.productos FOR SELECT USING (true);
CREATE POLICY productos_write ON public.productos FOR ALL
  USING (public.auth_rol() IN ('operadora','administrativo'))
  WITH CHECK (public.auth_rol() IN ('operadora','administrativo'));

-- ========================================
-- pedidos / pedido_productos: lectura libre; ESCRITURA SOLO VÍA RPC
-- (las RPC usan SECURITY DEFINER y bypasean RLS)
-- ========================================
CREATE POLICY pedidos_select ON public.pedidos FOR SELECT USING (true);
CREATE POLICY pedido_productos_select ON public.pedido_productos FOR SELECT USING (true);
-- (sin policies de INSERT/UPDATE/DELETE para usuarios autenticados)

-- ========================================
-- movimientos_credito / creditos_buckets: lectura libre; ESCRITURA SOLO VÍA RPC
-- ========================================
CREATE POLICY movimientos_select ON public.movimientos_credito FOR SELECT USING (true);
CREATE POLICY buckets_select ON public.creditos_buckets FOR SELECT USING (true);

-- ========================================
-- configuracion: todos leen; administrativo escribe
-- ========================================
CREATE POLICY config_select ON public.configuracion FOR SELECT USING (true);
CREATE POLICY config_admin ON public.configuracion FOR ALL
  USING (public.auth_rol() = 'administrativo')
  WITH CHECK (public.auth_rol() = 'administrativo');

-- ========================================
-- menu_ciclo: todos leen; administrativo escribe
-- ========================================
CREATE POLICY menu_select ON public.menu_ciclo FOR SELECT USING (true);
CREATE POLICY menu_admin ON public.menu_ciclo FOR ALL
  USING (public.auth_rol() = 'administrativo')
  WITH CHECK (public.auth_rol() = 'administrativo');
