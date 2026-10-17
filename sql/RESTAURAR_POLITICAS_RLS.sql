-- =====================================================
-- RESTAURAR POLÍTICAS RLS
-- =====================================================
-- Úsalo cuando la app muestre
-- "new row violates row-level security policy for table ...".
-- Crea una política de acceso completo para usuarios con sesión iniciada
-- en cada tabla de public que tenga RLS activado y no la tenga ya.
-- Ejecutar en Supabase > SQL Editor (después de RESTAURAR_PERMISOS_TABLAS.sql).

DO $$
DECLARE
  t record;
BEGIN
  FOR t IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public' AND rowsecurity = true
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = t.tablename
        AND policyname = 'acceso_usuarios_autenticados'
    ) THEN
      EXECUTE format(
        'CREATE POLICY acceso_usuarios_autenticados ON public.%I
           FOR ALL TO authenticated USING (true) WITH CHECK (true)',
        t.tablename
      );
      RAISE NOTICE 'Política creada en %', t.tablename;
    END IF;
  END LOOP;
END $$;

-- Catálogo público: permitir ver productos sin iniciar sesión
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'productos' AND rowsecurity = true
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'productos'
      AND policyname = 'catalogo_publico_lectura'
  ) THEN
    CREATE POLICY catalogo_publico_lectura ON public.productos
      FOR SELECT TO anon USING (true);
  END IF;
END $$;

-- Ver las políticas que quedaron
SELECT tablename, policyname, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
