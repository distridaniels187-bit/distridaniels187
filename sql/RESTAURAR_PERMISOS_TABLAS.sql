-- =====================================================
-- RESTAURAR PERMISOS DE TABLAS
-- =====================================================
-- Úsalo cuando la app muestre "permission denied for table ...".
-- Pasa cuando la base se restauró desde un respaldo sin permisos (GRANT).
-- Ejecutar en Supabase > SQL Editor.

-- Usuarios que inician sesión en el sistema: acceso completo
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Tablas que se creen en el futuro reciben los mismos permisos
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO authenticated;

-- Catálogo público (sin iniciar sesión): solo puede ver productos.
-- Los pedidos del catálogo se guardan con la función crear_pedido_catalogo.
GRANT SELECT ON public.productos TO anon;

-- Ver qué tablas tienen RLS activado (si alguna sale en true y sigue fallando,
-- envía el nuevo mensaje de error)
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
