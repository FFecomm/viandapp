-- ViandApp · migración 0015 · Vincular múltiples padres a un mismo alumno
-- 1. Agregar fecha_nacimiento a alumnos (campo de verificación para el 2do padre)
-- 2. RPC fn_vincular_alumno_existente: el segundo padre se vincula sin pedir al admin
-- 3. RPC fn_actualizar_fecha_nacimiento: para que los padres completen el dato faltante

-- ========================================
-- 1. Campo fecha_nacimiento en alumnos
-- ========================================
ALTER TABLE public.alumnos
  ADD COLUMN IF NOT EXISTS fecha_nacimiento date;

COMMENT ON COLUMN public.alumnos.fecha_nacimiento IS
  'Usado como pieza de verificación cuando un segundo padre quiere vincularse al alumno. NO público (nombre+grado+división son datos relativamente conocidos, la fecha solo la sabe la familia).';

-- ========================================
-- 2. fn_vincular_alumno_existente
--   El segundo padre llama esta función con los datos del alumno (nombre,
--   grado, división, fecha de nacimiento). Si los 4 datos matchean exactamente
--   con un alumno y la familia del primer padre ya tiene una fecha de
--   nacimiento cargada (no nullable), se crea el vínculo. Sin esos datos no
--   funciona: previene que alguien con info parcial se vincule.
-- ========================================
CREATE OR REPLACE FUNCTION public.fn_vincular_alumno_existente(
  p_nombre_completo text,
  p_grado text,
  p_division text,
  p_fecha_nacimiento date,
  p_relacion text DEFAULT 'tutor'
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_rol text;
  v_alumno_id uuid;
  v_ya_vinculado boolean;
  v_nombre_norm text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'No estás autenticado';
  END IF;

  SELECT rol INTO v_rol FROM public.usuarios WHERE id = v_uid AND activo = true;
  IF v_rol IS DISTINCT FROM 'padre' THEN
    RAISE EXCEPTION 'Solo las familias pueden vincularse a un alumno';
  END IF;

  IF p_fecha_nacimiento IS NULL THEN
    RAISE EXCEPTION 'Falta la fecha de nacimiento';
  END IF;

  IF p_relacion NOT IN ('madre','padre','tutor','otro') THEN
    RAISE EXCEPTION 'Relación inválida: %', p_relacion;
  END IF;

  -- Normalización del nombre: trim + colapsar espacios + case-insensitive.
  v_nombre_norm := lower(regexp_replace(trim(p_nombre_completo), '\s+', ' ', 'g'));

  SELECT id INTO v_alumno_id
    FROM public.alumnos
   WHERE lower(regexp_replace(trim(nombre_completo), '\s+', ' ', 'g')) = v_nombre_norm
     AND lower(trim(grado)) = lower(trim(p_grado))
     AND lower(trim(division)) = lower(trim(p_division))
     AND fecha_nacimiento = p_fecha_nacimiento
     AND activo = true
   LIMIT 1;

  IF v_alumno_id IS NULL THEN
    -- Mensaje genérico para no filtrar si la falla fue por nombre, grado,
    -- división o fecha. Evita probing.
    RAISE EXCEPTION 'No encontramos un alumno con esos datos. Verificalos con la otra persona.';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.familias_alumnos
     WHERE usuario_id = v_uid AND alumno_id = v_alumno_id
  ) INTO v_ya_vinculado;
  IF v_ya_vinculado THEN
    RAISE EXCEPTION 'Ya estás vinculado a este alumno';
  END IF;

  INSERT INTO public.familias_alumnos (usuario_id, alumno_id, relacion)
  VALUES (v_uid, v_alumno_id, p_relacion);

  RETURN v_alumno_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_vincular_alumno_existente(text, text, text, date, text) TO authenticated;

-- ========================================
-- 3. fn_actualizar_fecha_nacimiento
--   Cualquier padre vinculado al alumno puede SETEAR la fecha de nacimiento
--   si todavía no está cargada. Una vez cargada no se puede cambiar desde
--   acá (cambiarla sería un vector para tomar control del vínculo). Si hay
--   que corregir, lo hace el admin.
-- ========================================
CREATE OR REPLACE FUNCTION public.fn_actualizar_fecha_nacimiento(
  p_alumno_id uuid,
  p_fecha date
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_es_propio boolean;
  v_actual date;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'No estás autenticado';
  END IF;

  IF p_fecha IS NULL THEN
    RAISE EXCEPTION 'Falta la fecha';
  END IF;
  IF p_fecha > CURRENT_DATE THEN
    RAISE EXCEPTION 'La fecha de nacimiento no puede ser futura';
  END IF;

  -- ¿Es uno de mis hijos?
  SELECT EXISTS (
    SELECT 1 FROM public.familias_alumnos
     WHERE usuario_id = v_uid AND alumno_id = p_alumno_id
  ) INTO v_es_propio;
  IF NOT v_es_propio THEN
    RAISE EXCEPTION 'Este alumno no está vinculado a tu cuenta';
  END IF;

  SELECT fecha_nacimiento INTO v_actual FROM public.alumnos WHERE id = p_alumno_id;
  IF v_actual IS NOT NULL THEN
    -- Ya estaba cargada: bloqueamos modificación desde acá para no abrir un
    -- vector de re-bind. Si hay que corregir, lo hace operadora/admin.
    RAISE EXCEPTION 'La fecha ya está cargada. Pedile al colegio que la corrija si está mal.';
  END IF;

  UPDATE public.alumnos SET fecha_nacimiento = p_fecha, updated_at = now() WHERE id = p_alumno_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_actualizar_fecha_nacimiento(uuid, date) TO authenticated;

-- ========================================
-- 4. fn_vincular_hijo: ahora acepta y guarda fecha_nacimiento
--   Se vuelve obligatoria de aquí en adelante para que el segundo padre
--   pueda matchear al alumno con esos 4 datos. Para alumnos legacy (cargados
--   antes de esta migración) la fecha queda NULL hasta que algún padre la
--   complete por fn_actualizar_fecha_nacimiento.
-- ========================================
DROP FUNCTION IF EXISTS public.fn_vincular_hijo(text, text, text, text);

CREATE OR REPLACE FUNCTION public.fn_vincular_hijo(
  p_nombre_completo text,
  p_grado text,
  p_division text,
  p_fecha_nacimiento date,
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
  IF p_fecha_nacimiento IS NULL THEN
    RAISE EXCEPTION 'Falta la fecha de nacimiento';
  END IF;
  IF p_fecha_nacimiento > CURRENT_DATE THEN
    RAISE EXCEPTION 'La fecha de nacimiento no puede ser futura';
  END IF;

  INSERT INTO public.alumnos (nombre_completo, grado, division, fecha_nacimiento, activo)
  VALUES (trim(p_nombre_completo), trim(p_grado), trim(p_division), p_fecha_nacimiento, true)
  RETURNING id INTO v_alumno_id;

  INSERT INTO public.familias_alumnos (usuario_id, alumno_id, relacion)
  VALUES (v_uid, v_alumno_id, p_relacion);

  RETURN v_alumno_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_vincular_hijo(text, text, text, date, text) TO authenticated;
