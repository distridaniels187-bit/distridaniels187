-- =====================================================
-- CATEGORÍAS DE PRODUCTOS (administrables desde la app)
-- =====================================================
-- Antes las categorías estaban escritas en el código (CatalogoProductos.jsx)
-- y para agregar una había que modificar el programa. Con esta tabla, los
-- usuarios que crean productos pueden agregar categorías desde el formulario.
--
-- Permisos:
--   * Ver: todos (el catálogo público también filtra por categoría).
--   * Crear: superadmin, admin, vendedor, inventario.
--   * Renombrar o eliminar: solo superadmin y admin.
--
-- Ejecutar en Supabase > SQL Editor, DESPUÉS de SEGURIDAD_ROLES_E_IMAGENES.sql
-- (usa la función public.rol_actual()). Es idempotente.

CREATE TABLE IF NOT EXISTS public.categorias_productos (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre text NOT NULL CHECK (length(btrim(nombre)) BETWEEN 2 AND 60),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Evita duplicados aunque cambien mayúsculas o espacios ("Aseo bebé" = "aseo bebé ")
CREATE UNIQUE INDEX IF NOT EXISTS categorias_productos_nombre_unico
  ON public.categorias_productos (lower(btrim(nombre)));

-- Categorías que existían en el código
INSERT INTO public.categorias_productos (nombre)
SELECT c FROM unnest(ARRAY[
  'Dolor y Fiebre', 'Antibióticos', 'Cuidado Digestivo', 'Vitaminas y Suplementos',
  'Cremas y Unguentos', 'Ampollas', 'Gotas oftálmicas', 'Cuidado Cardiovascular',
  'Salud Urinaria', 'Salud sexual e íntima', 'Primeros Auxilios', 'Cuidado Personal',
  'Antigripal Cuidado Respiratorio', 'Laboratorio', 'Sistema Nervioso', 'Aseo Bebé',
  'Fórmulas Lácteas'
]) AS c
ON CONFLICT DO NOTHING;

-- Categorías que ya tienen los productos (por si alguna no estaba en la lista)
INSERT INTO public.categorias_productos (nombre)
SELECT DISTINCT btrim(categoria)
FROM public.productos
WHERE length(btrim(coalesce(categoria, ''))) BETWEEN 2 AND 60
ON CONFLICT DO NOTHING;

ALTER TABLE public.categorias_productos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS categorias_lectura ON public.categorias_productos;
DROP POLICY IF EXISTS categorias_crear ON public.categorias_productos;
DROP POLICY IF EXISTS categorias_actualizar ON public.categorias_productos;
DROP POLICY IF EXISTS categorias_eliminar ON public.categorias_productos;

CREATE POLICY categorias_lectura ON public.categorias_productos
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY categorias_crear ON public.categorias_productos
  FOR INSERT TO authenticated
  WITH CHECK (public.rol_actual() IN ('superadmin', 'admin', 'vendedor', 'inventario'));

CREATE POLICY categorias_actualizar ON public.categorias_productos
  FOR UPDATE TO authenticated
  USING (public.rol_actual() IN ('superadmin', 'admin'))
  WITH CHECK (public.rol_actual() IN ('superadmin', 'admin'));

CREATE POLICY categorias_eliminar ON public.categorias_productos
  FOR DELETE TO authenticated
  USING (public.rol_actual() IN ('superadmin', 'admin'));

GRANT SELECT ON public.categorias_productos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categorias_productos TO authenticated;

-- Verificación
SELECT id, nombre FROM public.categorias_productos ORDER BY nombre;
