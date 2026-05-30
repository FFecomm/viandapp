-- ViandApp · migración 0005 · Interfaz para familias (padres/madres)
-- Suma el rol 'padre', la tabla familias_alumnos (vínculo N:N), y actualiza
-- RLS + RPCs para que los padres puedan operar sobre sus propios hijos.

-- ========================================
-- 1. Sumar 'padre' al CHECK de roles
-- ========================================
DO $$
DECLARE v_conname text;
BEGIN
  SELECT conname INTO v_conname
    FROM pg_constraint
   WHERE conrelid = 'public.usuarios'::regclass
     AND contype = 'c'
     AND pg_get_constraintdef(oid) LIKE '%operadora%';
  IF v_conname IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.usuarios DROP CONSTRAINT ' || quote_ident(v_conname);
  END IF;
END $$;

ALTER TABLE public.usuarios
  ADD CONSTRAINT usuarios_rol_check
  CHECK (rol IN ('operadora','encargada','administrativo','padre'));

-- ========================================
-- 2. Tabla familias_alumnos (vínculo padre ↔ hijo)
-- ========================================
CREATE TABLE public.familias_alumnos (
  usuario_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  alumno_id  uuid NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
  relacion   text NOT NULL CHECK (relacion IN ('madre','padre','tutor','otro')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (usuario_id, alumno_id)
);
CREATE INDEX familias_alumnos_alumno_idx ON public.familias_alumnos (alumno_id);

ALTER TABLE public.familias_alumnos ENABLE ROW LEVEL SECURITY;

-- Padre ve sus propios vínculos; staff ve todos.
CREATE POLICY familias_select ON public.familias_alumnos FOR SELECT
  USING (
    usuario_id = auth.uid()
    OR public.auth_rol() IN ('operadora','encargada','administrativo')
  );

-- Sólo administrativo gestiona los vínculos.
CREATE POLICY familias_admin_write ON public.familias_alumnos FOR ALL
  USING (public.auth_rol() = 'administrativo')
  WITH CHECK (public.auth_rol() = 'administrativo');

-- ========================================
-- 3. Helper: ¿el padre tiene este alumno?
-- ========================================
CREATE OR REPLACE FUNCTION public.es_alumno_propio(p_alumno_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.familias_alumnos
     WHERE usuario_id = auth.uid()
       AND alumno_id = p_alumno_id
  )
$$;

GRANT EXECUTE ON FUNCTION public.es_alumno_propio(uuid) TO authenticated;

-- ========================================
-- 4. Ajustar RLS para que padres vean solo lo suyo
-- ========================================

-- alumnos: padres ven sólo los vinculados
DROP POLICY IF EXISTS alumnos_select ON public.alumnos;
CREATE POLICY alumnos_select ON public.alumnos FOR SELECT
  USING (
    public.auth_rol() IN ('operadora','encargada','administrativo')
    OR public.es_alumno_propio(id)
  );

-- contactos: idem
DROP POLICY IF EXISTS contactos_select ON public.contactos;
CREATE POLICY contactos_select ON public.contactos FOR SELECT
  USING (
    public.auth_rol() IN ('operadora','encargada','administrativo')
    OR public.es_alumno_propio(alumno_id)
  );

-- pedidos: padres ven pedidos de sus hijos
DROP POLICY IF EXISTS pedidos_select ON public.pedidos;
CREATE POLICY pedidos_select ON public.pedidos FOR SELECT
  USING (
    public.auth_rol() IN ('operadora','encargada','administrativo')
    OR public.es_alumno_propio(alumno_id)
  );

-- pedido_productos: idem (filtra por pedido.alumno_id)
DROP POLICY IF EXISTS pedido_productos_select ON public.pedido_productos;
CREATE POLICY pedido_productos_select ON public.pedido_productos FOR SELECT
  USING (
    public.auth_rol() IN ('operadora','encargada','administrativo')
    OR EXISTS (
      SELECT 1 FROM public.pedidos p
       WHERE p.id = pedido_productos.pedido_id
         AND public.es_alumno_propio(p.alumno_id)
    )
  );

-- movimientos_credito: padres ven movimientos de sus hijos
DROP POLICY IF EXISTS movimientos_select ON public.movimientos_credito;
CREATE POLICY movimientos_select ON public.movimientos_credito FOR SELECT
  USING (
    public.auth_rol() IN ('operadora','encargada','administrativo')
    OR public.es_alumno_propio(alumno_id)
  );

-- creditos_buckets: idem
DROP POLICY IF EXISTS buckets_select ON public.creditos_buckets;
CREATE POLICY buckets_select ON public.creditos_buckets FOR SELECT
  USING (
    public.auth_rol() IN ('operadora','encargada','administrativo')
    OR public.es_alumno_propio(alumno_id)
  );

-- ========================================
-- 5. Permitir 'padre' en fn_crear_perfil_usuario
-- ========================================
CREATE OR REPLACE FUNCTION public.fn_crear_perfil_usuario(
  p_user_id uuid,
  p_nombre text,
  p_rol text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_rol_invocante text;
BEGIN
  SELECT rol INTO v_rol_invocante FROM public.usuarios WHERE id = auth.uid() AND activo = true;
  IF v_rol_invocante IS DISTINCT FROM 'administrativo' THEN
    RAISE EXCEPTION 'Solo el Administrativo puede crear perfiles';
  END IF;
  IF p_rol NOT IN ('operadora','encargada','administrativo','padre') THEN
    RAISE EXCEPTION 'Rol inválido: %', p_rol;
  END IF;
  INSERT INTO public.usuarios (id, nombre, rol) VALUES (p_user_id, p_nombre, p_rol);
END;
$$;

-- ========================================
-- 6. fn_cargar_pedido: ahora también acepta padres
-- ========================================
CREATE OR REPLACE FUNCTION public.fn_cargar_pedido(
  p_alumno_id uuid,
  p_fecha date,
  p_menu text,
  p_observaciones text,
  p_forma_pago_vianda text,
  p_precio_vianda numeric,
  p_productos jsonb DEFAULT '[]'::jsonb
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_usuario_id uuid := auth.uid();
  v_rol text;
  v_pedido_id uuid;
  v_pedido_producto_id uuid;
  v_es_agregado boolean;
  v_hoy date := (now() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date;
  v_resto numeric;
  v_prod jsonb;
  v_producto_precio numeric;
  v_cantidad integer;
  v_monto_producto numeric;
  v_forma_prod text;
BEGIN
  SELECT rol INTO v_rol FROM public.usuarios WHERE id = v_usuario_id AND activo = true;

  IF v_rol = 'padre' THEN
    -- Padres sólo pueden cargar para sus propios hijos
    IF NOT public.es_alumno_propio(p_alumno_id) THEN
      RAISE EXCEPTION 'Este alumno no está vinculado a tu cuenta';
    END IF;
    -- Padres no pueden pagar en efectivo (no están en el cole). Tampoco transferencia
    -- registrada por ellos (la concilia el admin al recibirla, mientras tanto es "a deber")
    IF p_forma_pago_vianda NOT IN ('credito','a_deber') THEN
      RAISE EXCEPTION 'Sólo podés pagar con crédito a favor o dejar a deber';
    END IF;
  ELSIF v_rol <> 'operadora' THEN
    RAISE EXCEPTION 'No autorizado para cargar pedidos';
  END IF;

  v_es_agregado := (p_fecha = v_hoy);

  INSERT INTO public.pedidos (
    alumno_id, fecha, menu, observaciones,
    forma_pago_vianda, precio_vianda, es_agregado, cargado_por
  ) VALUES (
    p_alumno_id, p_fecha, p_menu, p_observaciones,
    p_forma_pago_vianda, p_precio_vianda, v_es_agregado, v_usuario_id
  ) RETURNING id INTO v_pedido_id;

  IF p_forma_pago_vianda = 'credito' THEN
    v_resto := public._consumir_buckets(
      p_alumno_id, p_precio_vianda, v_pedido_id, NULL,
      'consumo_vianda', v_usuario_id, p_precio_vianda
    );
    IF v_resto > 0 THEN
      INSERT INTO public.movimientos_credito (
        alumno_id, tipo, monto, precio_vianda_al_momento,
        pedido_id, usuario_id, forma_pago, nota
      ) VALUES (
        p_alumno_id, 'deuda_vianda', -v_resto, p_precio_vianda,
        v_pedido_id, v_usuario_id, 'a_deber',
        'Crédito insuficiente al consumir vianda; diferencia generada como deuda'
      );
    END IF;
  ELSIF p_forma_pago_vianda = 'a_deber' THEN
    INSERT INTO public.movimientos_credito (
      alumno_id, tipo, monto, precio_vianda_al_momento,
      pedido_id, usuario_id, forma_pago
    ) VALUES (
      p_alumno_id, 'deuda_vianda', -p_precio_vianda, p_precio_vianda,
      v_pedido_id, v_usuario_id, 'a_deber'
    );
  END IF;

  IF jsonb_array_length(p_productos) > 0 THEN
    FOR v_prod IN SELECT * FROM jsonb_array_elements(p_productos)
    LOOP
      SELECT precio INTO v_producto_precio
        FROM public.productos
       WHERE id = (v_prod->>'producto_id')::uuid;
      IF v_producto_precio IS NULL THEN
        RAISE EXCEPTION 'Producto no encontrado: %', v_prod->>'producto_id';
      END IF;

      v_cantidad := COALESCE((v_prod->>'cantidad')::int, 1);
      v_monto_producto := v_producto_precio * v_cantidad;
      v_forma_prod := COALESCE(v_prod->>'forma_pago', p_forma_pago_vianda);

      IF v_rol = 'padre' AND v_forma_prod NOT IN ('credito','a_deber') THEN
        RAISE EXCEPTION 'Sólo podés pagar productos con crédito o a deber';
      END IF;

      INSERT INTO public.pedido_productos (
        pedido_id, producto_id, cantidad, precio_al_momento, forma_pago
      ) VALUES (
        v_pedido_id, (v_prod->>'producto_id')::uuid, v_cantidad,
        v_producto_precio, v_forma_prod
      ) RETURNING id INTO v_pedido_producto_id;

      IF v_forma_prod = 'credito' THEN
        v_resto := public._consumir_buckets(
          p_alumno_id, v_monto_producto, v_pedido_id, v_pedido_producto_id,
          'consumo_producto', v_usuario_id, p_precio_vianda
        );
        IF v_resto > 0 THEN
          INSERT INTO public.movimientos_credito (
            alumno_id, tipo, monto, pedido_id, pedido_producto_id,
            usuario_id, forma_pago, nota
          ) VALUES (
            p_alumno_id, 'deuda_producto', -v_resto, v_pedido_id, v_pedido_producto_id,
            v_usuario_id, 'a_deber',
            'Crédito insuficiente al consumir producto; diferencia generada como deuda'
          );
        END IF;
      ELSIF v_forma_prod = 'a_deber' THEN
        INSERT INTO public.movimientos_credito (
          alumno_id, tipo, monto, pedido_id, pedido_producto_id,
          usuario_id, forma_pago
        ) VALUES (
          p_alumno_id, 'deuda_producto', -v_monto_producto, v_pedido_id, v_pedido_producto_id,
          v_usuario_id, 'a_deber'
        );
      END IF;
    END LOOP;
  END IF;

  PERFORM public._recalcular_alumno(p_alumno_id);
  RETURN v_pedido_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_cargar_pedido(uuid, date, text, text, text, numeric, jsonb) TO authenticated;

-- ========================================
-- 7. fn_borrar_pedido: padres pueden borrar los suyos
-- ========================================
CREATE OR REPLACE FUNCTION public.fn_borrar_pedido(p_pedido_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_usuario_id uuid := auth.uid();
  v_rol text;
  v_alumno_id uuid;
  v_mov record;
BEGIN
  SELECT rol INTO v_rol FROM public.usuarios WHERE id = v_usuario_id AND activo = true;

  SELECT alumno_id INTO v_alumno_id FROM public.pedidos WHERE id = p_pedido_id;
  IF v_alumno_id IS NULL THEN
    RAISE EXCEPTION 'Pedido no encontrado: %', p_pedido_id;
  END IF;

  IF v_rol = 'padre' THEN
    IF NOT public.es_alumno_propio(v_alumno_id) THEN
      RAISE EXCEPTION 'Este pedido no es de un alumno tuyo';
    END IF;
  ELSIF v_rol <> 'operadora' THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  FOR v_mov IN
    SELECT id, tipo, monto, bucket_id, pedido_producto_id
      FROM public.movimientos_credito
     WHERE pedido_id = p_pedido_id
     ORDER BY created_at DESC
  LOOP
    IF v_mov.tipo IN ('consumo_vianda','consumo_producto') THEN
      IF v_mov.bucket_id IS NOT NULL THEN
        UPDATE public.creditos_buckets
           SET pesos_restantes = pesos_restantes + (-v_mov.monto),
               agotado = false
         WHERE id = v_mov.bucket_id;
      END IF;
      INSERT INTO public.movimientos_credito (
        alumno_id, tipo, monto, pedido_id, pedido_producto_id, bucket_id,
        usuario_id, nota
      ) VALUES (
        v_alumno_id,
        CASE v_mov.tipo
          WHEN 'consumo_vianda'   THEN 'reverso_consumo_vianda'
          WHEN 'consumo_producto' THEN 'reverso_consumo_producto'
        END,
        -v_mov.monto,
        p_pedido_id, v_mov.pedido_producto_id, v_mov.bucket_id,
        v_usuario_id, 'Reverso por borrado de pedido'
      );

    ELSIF v_mov.tipo = 'deuda_vianda' THEN
      INSERT INTO public.movimientos_credito (
        alumno_id, tipo, monto, pedido_id, usuario_id, nota
      ) VALUES (
        v_alumno_id, 'reverso_deuda_vianda', -v_mov.monto,
        p_pedido_id, v_usuario_id, 'Reverso por borrado de pedido'
      );

    ELSIF v_mov.tipo = 'deuda_producto' THEN
      INSERT INTO public.movimientos_credito (
        alumno_id, tipo, monto, pedido_id, pedido_producto_id, usuario_id, nota
      ) VALUES (
        v_alumno_id, 'reverso_deuda_producto', -v_mov.monto,
        p_pedido_id, v_mov.pedido_producto_id, v_usuario_id, 'Reverso por borrado de pedido'
      );
    END IF;
  END LOOP;

  DELETE FROM public.pedidos WHERE id = p_pedido_id;
  PERFORM public._recalcular_alumno(v_alumno_id);
END;
$$;

-- ========================================
-- 8. RPC: traer mis alumnos (para el home del padre)
-- ========================================
CREATE OR REPLACE FUNCTION public.fn_mis_alumnos()
RETURNS TABLE (
  id uuid,
  nombre_completo text,
  grado text,
  division text,
  credito_pesos numeric,
  viandas_credito integer,
  relacion text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT a.id, a.nombre_completo, a.grado, a.division, a.credito_pesos, a.viandas_credito, fa.relacion
    FROM public.familias_alumnos fa
    JOIN public.alumnos a ON a.id = fa.alumno_id
   WHERE fa.usuario_id = auth.uid()
     AND a.activo = true
   ORDER BY a.nombre_completo;
$$;

GRANT EXECUTE ON FUNCTION public.fn_mis_alumnos() TO authenticated;
