-- ViandApp · 0018 · Opciones predefinidas por menú
-- En vez de que el padre escriba observaciones a mano (sin queso, sin tomate,
-- etc.), el admin define un catálogo de opciones por cada menú y el padre
-- tilda las que quiera. Las elegidas se concatenan y se guardan en
-- `pedidos.observaciones`.

CREATE TABLE public.menu_opciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu text NOT NULL CHECK (menu IN ('A','B','C','Hamburguesa','Fideos','Sandwich')),
  texto text NOT NULL CHECK (length(trim(texto)) > 0),
  orden integer NOT NULL DEFAULT 0,
  activa boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX menu_opciones_menu_idx ON public.menu_opciones (menu, orden) WHERE activa = true;

CREATE TRIGGER menu_opciones_updated
  BEFORE UPDATE ON public.menu_opciones
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.menu_opciones ENABLE ROW LEVEL SECURITY;

-- Cualquier usuario autenticado puede leer (el padre las necesita para el wizard)
CREATE POLICY menu_opciones_select ON public.menu_opciones FOR SELECT
  TO authenticated USING (true);

-- Solo admin puede crear, editar, borrar
CREATE POLICY menu_opciones_admin_write ON public.menu_opciones FOR ALL
  TO authenticated
  USING (public.auth_rol() = 'administrativo')
  WITH CHECK (public.auth_rol() = 'administrativo');

-- Semilla con ejemplos para que el admin no arranque vacío.
-- Puede borrarlos o editarlos desde /menus/opciones.
INSERT INTO public.menu_opciones (menu, texto, orden) VALUES
  ('Hamburguesa', 'Sin queso', 1),
  ('Hamburguesa', 'Sin tomate', 2),
  ('Hamburguesa', 'Sin lechuga', 3),
  ('Hamburguesa', 'Sin papas', 4),
  ('Fideos', 'Salsa pesto', 1),
  ('Fideos', 'Salsa blanca', 2),
  ('Fideos', 'Salsa tuco', 3),
  ('Fideos', 'Sin queso', 4),
  ('Sandwich', 'Sin mayonesa', 1),
  ('Sandwich', 'Sin lechuga', 2),
  ('Sandwich', 'Sin tomate', 3);
