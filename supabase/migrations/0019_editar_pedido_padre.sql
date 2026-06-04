-- ViandApp · 0019 · El padre puede editar pedidos futuros (menú y observaciones)

CREATE OR REPLACE FUNCTION public.fn_editar_mi_pedido(
  p_pedido_id uuid,
  p_menu text,
  p_observaciones text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_rol text;
  v_pedido record;
BEGIN
  SELECT rol INTO v_rol FROM public.usuarios WHERE id = v_uid AND activo = true;

  SELECT * INTO v_pedido FROM public.pedidos WHERE id = p_pedido_id;
  IF v_pedido.id IS NULL THEN
    RAISE EXCEPTION 'Pedido no encontrado';
  END IF;

  -- Auth: padre solo edita los de sus alumnos; staff puede editar cualquiera
  IF v_rol = 'padre' THEN
    IF NOT public.es_alumno_propio(v_pedido.alumno_id) THEN
      RAISE EXCEPTION 'Este pedido no es de un alumno tuyo';
    END IF;
  ELSIF v_rol NOT IN ('operadora','encargada','administrativo') THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  -- No se edita un pedido ya entregado o cancelado
  IF v_pedido.estado IN ('entregado','cancelado','ausente_acreditado') THEN
    RAISE EXCEPTION 'No se puede editar un pedido %', v_pedido.estado;
  END IF;

  IF p_menu NOT IN ('A','B','C','Hamburguesa','Fideos','Sandwich') THEN
    RAISE EXCEPTION 'Menú inválido: %', p_menu;
  END IF;

  UPDATE public.pedidos
     SET menu = p_menu,
         observaciones = p_observaciones,
         updated_at = now()
   WHERE id = p_pedido_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_editar_mi_pedido(uuid, text, text) TO authenticated;
