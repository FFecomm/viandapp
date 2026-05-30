-- ViandApp · migración 0008 · Auto-registro y onboarding de familias
-- Permite que un padre cree su propio perfil al registrarse y vincule a sus
-- hijos durante el onboarding (sin necesidad de que un admin lo haga).

-- ========================================
-- 1. fn_self_register_padre
--    Llamada justo después del signUp de Supabase Auth.
--    Crea el perfil en `usuarios` con rol='padre' usando el auth.uid() del request.
-- ========================================
CREATE OR REPLACE FUNCTION public.fn_self_register_padre(
  p_nombre text,
  p_telefono text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;
  IF EXISTS (SELECT 1 FROM public.usuarios WHERE id = v_uid) THEN
    -- Ya tiene perfil; nada que hacer.
    RETURN;
  END IF;
  IF length(coalesce(trim(p_nombre), '')) = 0 THEN
    RAISE EXCEPTION 'Nombre obligatorio';
  END IF;
  INSERT INTO public.usuarios (id, nombre, rol, activo)
  VALUES (v_uid, trim(p_nombre), 'padre', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_self_register_padre(text, text) TO authenticated;

-- ========================================
-- 2. fn_vincular_hijo
--    Permite a un padre crear un alumno y vincularlo a su propio perfil.
--    En este modelo el padre auto-onboarda a sus hijos (no requiere admin previo).
-- ========================================
CREATE OR REPLACE FUNCTION public.fn_vincular_hijo(
  p_nombre_completo text,
  p_grado text,
  p_division text,
  p_relacion text DEFAULT 'tutor'
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_rol text;
  v_alumno_id uuid;
BEGIN
  SELECT rol INTO v_rol FROM public.usuarios WHERE id = v_uid AND activo = true;
  IF v_rol <> 'padre' THEN
    RAISE EXCEPTION 'Solo un padre puede vincular hijos a su cuenta';
  END IF;
  IF p_relacion NOT IN ('madre','padre','tutor','otro') THEN
    RAISE EXCEPTION 'Relación inválida: %', p_relacion;
  END IF;
  IF length(coalesce(trim(p_nombre_completo), '')) = 0 THEN
    RAISE EXCEPTION 'Nombre del alumno obligatorio';
  END IF;

  INSERT INTO public.alumnos (nombre_completo, grado, division, activo)
  VALUES (trim(p_nombre_completo), p_grado, p_division, true)
  RETURNING id INTO v_alumno_id;

  INSERT INTO public.familias_alumnos (usuario_id, alumno_id, relacion)
  VALUES (v_uid, v_alumno_id, p_relacion);

  RETURN v_alumno_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_vincular_hijo(text, text, text, text) TO authenticated;
