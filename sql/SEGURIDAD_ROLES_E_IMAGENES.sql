-- =====================================================
-- SEGURIDAD: PERMISOS POR ROL E IMÁGENES DE PRODUCTOS
-- =====================================================
-- Antes de este script, cualquier usuario con sesión iniciada (aunque no tuviera
-- rol, o fuera "cliente") podía modificar cualquier tabla y subir, reemplazar o
-- borrar imágenes llamando directamente a la API de Supabase.
--
-- Después de este script:
--   * Las tablas internas solo las usan los roles del personal
--     (superadmin, admin, contabilidad, inventario, vendedor).
--   * productos: todos pueden VER (el catálogo es público); crear lo hacen
--     superadmin/admin/vendedor; actualizar (stock, precios) también inventario;
--     eliminar solo superadmin/admin.
--   * Imágenes de productos: solo superadmin y admin pueden subir, reemplazar,
--     borrar o cambiar la imagen de un producto.
--
-- El rol se lee de app_metadata.role, que solo se puede cambiar desde el panel
-- de Supabase o con la service_role key (el usuario no puede modificarlo).
--
-- Ejecutar en Supabase > SQL Editor, DESPUÉS de STORAGE_IMAGENES_PRODUCTOS.sql.
-- El script es idempotente: se puede ejecutar varias veces.

-- -----------------------------------------------------
-- 1. Rol del usuario actual
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.rol_actual()
RETURNS text
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'role', ''));
$$;

GRANT EXECUTE ON FUNCTION public.rol_actual() TO anon, authenticated;

-- -----------------------------------------------------
-- 2. Tablas internas: solo personal con rol válido
-- -----------------------------------------------------
-- Reemplaza la política "acceso_usuarios_autenticados" (USING true) de
-- RESTAURAR_POLITICAS_RLS.sql por una que exige un rol del personal.
-- El rol "cliente" crea sus pedidos con la función crear_pedido_catalogo
-- (SECURITY DEFINER), así que no necesita acceso directo a las tablas.
DO $$
DECLARE
  t record;
BEGIN
  FOR t IN
    SELECT tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND policyname = 'acceso_usuarios_autenticados'
      AND tablename <> 'productos'
  LOOP
    EXECUTE format('DROP POLICY acceso_usuarios_autenticados ON public.%I', t.tablename);
    EXECUTE format(
      'CREATE POLICY acceso_usuarios_autenticados ON public.%I
         FOR ALL TO authenticated
         USING (public.rol_actual() IN (''superadmin'', ''admin'', ''contabilidad'', ''inventario'', ''vendedor''))
         WITH CHECK (public.rol_actual() IN (''superadmin'', ''admin'', ''contabilidad'', ''inventario'', ''vendedor''))',
      t.tablename
    );
    RAISE NOTICE 'Política por rol aplicada en %', t.tablename;
  END LOOP;
END $$;

-- -----------------------------------------------------
-- 3. productos: permisos por acción
-- -----------------------------------------------------
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS acceso_usuarios_autenticados ON public.productos;
DROP POLICY IF EXISTS catalogo_publico_lectura ON public.productos;
DROP POLICY IF EXISTS productos_lectura ON public.productos;
DROP POLICY IF EXISTS productos_crear ON public.productos;
DROP POLICY IF EXISTS productos_actualizar ON public.productos;
DROP POLICY IF EXISTS productos_eliminar ON public.productos;

-- Catálogo público: cualquiera puede ver productos
CREATE POLICY productos_lectura ON public.productos
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY productos_crear ON public.productos
  FOR INSERT TO authenticated
  WITH CHECK (public.rol_actual() IN ('superadmin', 'admin', 'vendedor'));

-- inventario y vendedor necesitan actualizar stock (ajustes y ventas)
CREATE POLICY productos_actualizar ON public.productos
  FOR UPDATE TO authenticated
  USING (public.rol_actual() IN ('superadmin', 'admin', 'vendedor', 'inventario'))
  WITH CHECK (public.rol_actual() IN ('superadmin', 'admin', 'vendedor', 'inventario'));

CREATE POLICY productos_eliminar ON public.productos
  FOR DELETE TO authenticated
  USING (public.rol_actual() IN ('superadmin', 'admin'));

-- -----------------------------------------------------
-- 4. Solo superadmin/admin pueden poner o cambiar la imagen de un producto
-- -----------------------------------------------------
-- Las políticas de fila no controlan columnas, así que un vendedor podría
-- cambiar imagen_url por una URL externa. Este trigger lo impide.
CREATE OR REPLACE FUNCTION public.proteger_imagen_producto()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  -- Sin usuario de la app (SQL Editor, service_role, scripts de migración): se permite
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF public.rol_actual() IN ('superadmin', 'admin') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF coalesce(NEW.imagen_url, '') <> '' OR coalesce(NEW.imagen_public_id, '') <> '' THEN
      RAISE EXCEPTION 'Solo un administrador puede asignar imágenes a los productos'
        USING ERRCODE = '42501';
    END IF;
  ELSIF NEW.imagen_url IS DISTINCT FROM OLD.imagen_url
     OR NEW.imagen_public_id IS DISTINCT FROM OLD.imagen_public_id THEN
    RAISE EXCEPTION 'Solo un administrador puede cambiar la imagen de un producto'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_proteger_imagen_producto ON public.productos;
CREATE TRIGGER trg_proteger_imagen_producto
  BEFORE INSERT OR UPDATE ON public.productos
  FOR EACH ROW
  EXECUTE FUNCTION public.proteger_imagen_producto();

-- -----------------------------------------------------
-- 5. Storage: solo superadmin/admin suben, reemplazan o borran imágenes
-- -----------------------------------------------------
-- El bucket sigue siendo público para VER las imágenes por su URL.
DROP POLICY IF EXISTS "productos_subir_autenticados" ON storage.objects;
DROP POLICY IF EXISTS "productos_actualizar_autenticados" ON storage.objects;
DROP POLICY IF EXISTS "productos_borrar_autenticados" ON storage.objects;
DROP POLICY IF EXISTS "productos_imagenes_ver_admin" ON storage.objects;
DROP POLICY IF EXISTS "productos_imagenes_subir_admin" ON storage.objects;
DROP POLICY IF EXISTS "productos_imagenes_actualizar_admin" ON storage.objects;
DROP POLICY IF EXISTS "productos_imagenes_borrar_admin" ON storage.objects;

-- Listar/consultar objetos por la API (necesario para borrar); ver por URL pública no lo necesita
CREATE POLICY "productos_imagenes_ver_admin" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'productos' AND public.rol_actual() IN ('superadmin', 'admin'));

CREATE POLICY "productos_imagenes_subir_admin" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'productos' AND public.rol_actual() IN ('superadmin', 'admin'));

CREATE POLICY "productos_imagenes_actualizar_admin" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'productos' AND public.rol_actual() IN ('superadmin', 'admin'))
  WITH CHECK (bucket_id = 'productos' AND public.rol_actual() IN ('superadmin', 'admin'));

CREATE POLICY "productos_imagenes_borrar_admin" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'productos' AND public.rol_actual() IN ('superadmin', 'admin'));

-- -----------------------------------------------------
-- 6. Verificación
-- -----------------------------------------------------
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE (schemaname = 'public' AND tablename = 'productos')
   OR (schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE 'productos_%')
ORDER BY tablename, policyname;

-- Tablas de public con RLS desactivado (cualquiera con la anon key podría leerlas y modificarlas)
SELECT tablename AS tabla_sin_rls
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = false;
