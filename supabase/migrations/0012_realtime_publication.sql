-- ViandApp · migración 0012 · Realtime publication
-- Agrega pedidos y pedido_productos a la publicación `supabase_realtime`
-- para que los suscriptores reciban eventos de cambios.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'pedidos'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pedidos;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'pedido_productos'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pedido_productos;
  END IF;
END $$;
