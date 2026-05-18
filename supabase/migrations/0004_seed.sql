-- ViandApp · migración 0004 · Seed inicial
-- Datos base: precio de vianda, productos, los 42 menús del ciclo.
-- Los usuarios NO se crean acá — el primer Administrativo se da de alta a mano en Supabase Auth.

-- ========================================
-- Configuración
-- ========================================
INSERT INTO public.configuracion (key, value) VALUES
  ('precio_vianda_actual', '9500')
ON CONFLICT (key) DO NOTHING;

-- ========================================
-- Productos base (editables luego)
-- ========================================
INSERT INTO public.productos (nombre, precio, categoria) VALUES
  ('Agua mineral', 1500, 'bebida'),
  ('Jugo natural', 2000, 'bebida')
ON CONFLICT DO NOTHING;

-- ========================================
-- Menú del ciclo (14 días × 3 tipos = 42 entradas)
-- Descripciones placeholders; el Administrativo las edita desde la app.
-- ========================================
INSERT INTO public.menu_ciclo (dia_ciclo, tipo_menu, descripcion) VALUES
  (1,  'A', 'Pollo al horno con puré'),
  (1,  'B', 'Pasta bolognesa'),
  (1,  'C', 'Wok de verduras con arroz'),
  (2,  'A', 'Milanesa con papas'),
  (2,  'B', 'Tarta de jamón y queso'),
  (2,  'C', 'Ensalada caesar con pollo'),
  (3,  'A', 'Carne al horno con batatas'),
  (3,  'B', 'Ravioles con salsa'),
  (3,  'C', 'Bowl de quinoa y verduras'),
  (4,  'A', 'Pollo grillado con arroz'),
  (4,  'B', 'Empanadas de carne'),
  (4,  'C', 'Salmón con vegetales al vapor'),
  (5,  'A', 'Albóndigas con puré'),
  (5,  'B', 'Pizza de muzzarella'),
  (5,  'C', 'Ensalada de atún'),
  (6,  'A', 'Suprema napolitana'),
  (6,  'B', 'Lasaña'),
  (6,  'C', 'Pollo grillado con ensalada'),
  (7,  'A', 'Bife con papas'),
  (7,  'B', 'Canelones'),
  (7,  'C', 'Tortilla de papas con ensalada'),
  (8,  'A', 'Pollo a la portuguesa'),
  (8,  'B', 'Ñoquis con tuco'),
  (8,  'C', 'Pechuga al limón con verduras'),
  (9,  'A', 'Cazuela de pollo'),
  (9,  'B', 'Sorrentinos'),
  (9,  'C', 'Wrap de pollo y vegetales'),
  (10, 'A', 'Carne a la cacerola con puré'),
  (10, 'B', 'Pastel de papas'),
  (10, 'C', 'Pollo con quinoa'),
  (11, 'A', 'Milanesa napolitana'),
  (11, 'B', 'Tallarines con salsa'),
  (11, 'C', 'Salteado de pollo y verduras'),
  (12, 'A', 'Pollo al curry con arroz'),
  (12, 'B', 'Tarta de verdura'),
  (12, 'C', 'Ensalada de pollo y palta'),
  (13, 'A', 'Pollo agridulce con arroz'),
  (13, 'B', 'Fideos con manteca y queso'),
  (13, 'C', 'Pescado al horno con vegetales'),
  (14, 'A', 'Carne al horno con papas'),
  (14, 'B', 'Pizza de jamón y morrón'),
  (14, 'C', 'Pollo grillado con puré de calabaza')
ON CONFLICT (dia_ciclo, tipo_menu) DO NOTHING;
