-- =====================================================
-- STORAGE: IMÁGENES DE PRODUCTOS
-- =====================================================
-- Crea el bucket público "productos" en Supabase Storage para guardar
-- las imágenes de productos (WebP), en lugar de Cloudinary.
-- Ejecutar una sola vez en Supabase > SQL Editor.

-- Bucket público: cualquiera puede VER las imágenes (el catálogo es público).
-- Límite de 2 MB por archivo (las imágenes llegan comprimidas, ~50-150 KB).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('productos', 'productos', true, 2097152, ARRAY['image/webp', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Solo usuarios con sesión iniciada pueden subir, reemplazar o borrar imágenes
DROP POLICY IF EXISTS "productos_subir_autenticados" ON storage.objects;
CREATE POLICY "productos_subir_autenticados" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'productos');

DROP POLICY IF EXISTS "productos_actualizar_autenticados" ON storage.objects;
CREATE POLICY "productos_actualizar_autenticados" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'productos')
  WITH CHECK (bucket_id = 'productos');

DROP POLICY IF EXISTS "productos_borrar_autenticados" ON storage.objects;
CREATE POLICY "productos_borrar_autenticados" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'productos');

-- Verificación
SELECT id, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'productos';
