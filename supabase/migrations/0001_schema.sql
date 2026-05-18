-- ViandApp · migración 0001 · Schema base
-- Aplicar en Supabase SQL Editor o vía CLI. Tablas, índices, constraints, triggers de updated_at.

-- ========================================
-- Extensions
-- ========================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- búsqueda fuzzy en alumnos

-- ========================================
-- usuarios (perfiles 1:1 con auth.users)
-- ========================================
CREATE TABLE public.usuarios (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  rol text NOT NULL CHECK (rol IN ('operadora','encargada','administrativo')),
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ========================================
-- alumnos
-- ========================================
CREATE TABLE public.alumnos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_completo text NOT NULL,
  grado text NOT NULL,
  division text NOT NULL,
  credito_pesos numeric(12,2) NOT NULL DEFAULT 0,    -- agregado: signed (negativo = deuda)
  viandas_credito integer NOT NULL DEFAULT 0,        -- agregado: suma de buckets activos
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX alumnos_nombre_trgm_idx ON public.alumnos USING gin (nombre_completo gin_trgm_ops);
CREATE INDEX alumnos_grado_division_idx ON public.alumnos (grado, division);

-- ========================================
-- contactos (1:N con alumnos)
-- ========================================
CREATE TABLE public.contactos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id uuid NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  telefono text NOT NULL,
  relacion text NOT NULL CHECK (relacion IN ('madre','padre','otro')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX contactos_alumno_idx ON public.contactos (alumno_id);

-- ========================================
-- productos (catálogo de bebidas/extras)
-- ========================================
CREATE TABLE public.productos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  precio numeric(12,2) NOT NULL CHECK (precio >= 0),
  categoria text NOT NULL CHECK (categoria IN ('bebida','extra')),
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ========================================
-- pedidos
-- ========================================
CREATE TABLE public.pedidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id uuid NOT NULL REFERENCES public.alumnos(id),
  fecha date NOT NULL,
  menu text NOT NULL CHECK (menu IN ('A','B','C','Hamburguesa','Fideos','Sandwich')),
  observaciones text,
  forma_pago_vianda text NOT NULL CHECK (forma_pago_vianda IN ('credito','transferencia','efectivo','a_deber')),
  precio_vianda numeric(12,2) NOT NULL CHECK (precio_vianda >= 0),
  es_agregado boolean NOT NULL DEFAULT false,
  cargado_por uuid REFERENCES public.usuarios(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX pedidos_fecha_idx ON public.pedidos (fecha);
CREATE INDEX pedidos_alumno_fecha_idx ON public.pedidos (alumno_id, fecha);
CREATE INDEX pedidos_cargado_por_idx ON public.pedidos (cargado_por);

-- ========================================
-- pedido_productos (extras por pedido)
-- ========================================
CREATE TABLE public.pedido_productos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  producto_id uuid NOT NULL REFERENCES public.productos(id),
  cantidad integer NOT NULL CHECK (cantidad > 0) DEFAULT 1,
  precio_al_momento numeric(12,2) NOT NULL,
  forma_pago text NOT NULL CHECK (forma_pago IN ('credito','transferencia','efectivo','a_deber')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX pedido_productos_pedido_idx ON public.pedido_productos (pedido_id);

-- ========================================
-- movimientos_credito (ledger inmutable)
-- ========================================
CREATE TABLE public.movimientos_credito (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id uuid NOT NULL REFERENCES public.alumnos(id),
  tipo text NOT NULL CHECK (tipo IN (
    'carga',
    'consumo_vianda',
    'consumo_producto',
    'deuda_vianda',
    'deuda_producto',
    'cancelacion_deuda',
    'reverso_consumo_vianda',
    'reverso_consumo_producto',
    'reverso_deuda_vianda',
    'reverso_deuda_producto'
  )),
  monto numeric(12,2) NOT NULL,                          -- signed
  precio_vianda_al_momento numeric(12,2),
  viandas_equivalentes integer,
  pedido_id uuid REFERENCES public.pedidos(id) ON DELETE SET NULL,
  pedido_producto_id uuid REFERENCES public.pedido_productos(id) ON DELETE SET NULL,
  bucket_id uuid,                                        -- FK agregado abajo (forward ref)
  forma_pago text,
  usuario_id uuid REFERENCES public.usuarios(id),
  nota text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX movimientos_alumno_idx ON public.movimientos_credito (alumno_id, created_at DESC);
CREATE INDEX movimientos_created_idx ON public.movimientos_credito (created_at);
CREATE INDEX movimientos_pedido_idx ON public.movimientos_credito (pedido_id) WHERE pedido_id IS NOT NULL;

-- ========================================
-- creditos_buckets (estado materializado FIFO)
-- ========================================
CREATE TABLE public.creditos_buckets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id uuid NOT NULL REFERENCES public.alumnos(id),
  movimiento_carga_id uuid NOT NULL REFERENCES public.movimientos_credito(id),
  precio_vianda numeric(12,2) NOT NULL CHECK (precio_vianda > 0),  -- fijo al momento de carga
  pesos_restantes numeric(12,2) NOT NULL CHECK (pesos_restantes >= 0),
  agotado boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX creditos_buckets_fifo_idx ON public.creditos_buckets (alumno_id, agotado, created_at);

ALTER TABLE public.movimientos_credito
  ADD CONSTRAINT movimientos_credito_bucket_fk
  FOREIGN KEY (bucket_id) REFERENCES public.creditos_buckets(id) ON DELETE SET NULL;

-- ========================================
-- configuracion (key-value simple)
-- ========================================
CREATE TABLE public.configuracion (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.usuarios(id)
);

-- ========================================
-- menu_ciclo (14 días × 3 tipos = 42 entradas)
-- ========================================
CREATE TABLE public.menu_ciclo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dia_ciclo integer NOT NULL CHECK (dia_ciclo BETWEEN 1 AND 14),
  tipo_menu text NOT NULL CHECK (tipo_menu IN ('A','B','C')),
  descripcion text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.usuarios(id),
  UNIQUE (dia_ciclo, tipo_menu)
);

-- ========================================
-- Trigger genérico: updated_at
-- ========================================
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER usuarios_updated      BEFORE UPDATE ON public.usuarios      FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER alumnos_updated       BEFORE UPDATE ON public.alumnos       FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER productos_updated     BEFORE UPDATE ON public.productos     FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER pedidos_updated       BEFORE UPDATE ON public.pedidos       FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER configuracion_updated BEFORE UPDATE ON public.configuracion FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER menu_ciclo_updated    BEFORE UPDATE ON public.menu_ciclo    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
