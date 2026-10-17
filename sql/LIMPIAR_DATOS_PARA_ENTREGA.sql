-- =====================================================
-- LIMPIAR DATOS PARA ENTREGA AL CLIENTE
-- =====================================================
-- Borra los movimientos de prueba. CONSERVA productos, usuarios y proveedores.
-- ⚠️ No se puede deshacer. Haz un respaldo antes de ejecutarlo.
-- Ejecutar en Supabase > SQL Editor.

BEGIN;

-- Facturas y abonos (los abonos dependen de las facturas)
-- RESTART IDENTITY: la numeración vuelve a empezar desde 1
TRUNCATE TABLE public.abonos, public.facturas RESTART IDENTITY;

-- Clientes
TRUNCATE TABLE public.clientes RESTART IDENTITY;

-- Pedidos del catálogo
TRUNCATE TABLE public.preparaciones_pedidos, public.pedidos RESTART IDENTITY;

-- Movimientos, historial de inventario y auditoría de productos
-- (el stock actual de los productos NO cambia)
TRUNCATE TABLE public.movimientos_inventario, public.inventario_revisiones, public.auditoria_productos RESTART IDENTITY;

-- Gastos de la empresa
TRUNCATE TABLE public.gastos_empresa RESTART IDENTITY;

-- Facturas de proveedores y sus pagos (los proveedores se conservan)
TRUNCATE TABLE public.pagos_proveedores, public.facturas_proveedores RESTART IDENTITY;

-- ---------------------------------------------------
-- OPCIONAL: quita el "--" de las líneas que también quieras borrar
-- ---------------------------------------------------

-- Contabilidad y visitas de cobro
-- TRUNCATE TABLE public.contabilidad_clientes, public.contabilidad_reportes, public.visits_cobro RESTART IDENTITY;

-- Lista de proveedores
-- TRUNCATE TABLE public.proveedores RESTART IDENTITY;

COMMIT;

-- Verificación: las tablas borradas deben salir en 0 y productos con su total
SELECT 'facturas' AS tabla, COUNT(*) FROM public.facturas
UNION ALL SELECT 'abonos', COUNT(*) FROM public.abonos
UNION ALL SELECT 'clientes', COUNT(*) FROM public.clientes
UNION ALL SELECT 'pedidos', COUNT(*) FROM public.pedidos
UNION ALL SELECT 'movimientos_inventario', COUNT(*) FROM public.movimientos_inventario
UNION ALL SELECT 'inventario_revisiones', COUNT(*) FROM public.inventario_revisiones
UNION ALL SELECT 'auditoria_productos', COUNT(*) FROM public.auditoria_productos
UNION ALL SELECT 'gastos_empresa', COUNT(*) FROM public.gastos_empresa
UNION ALL SELECT 'facturas_proveedores', COUNT(*) FROM public.facturas_proveedores
UNION ALL SELECT 'pagos_proveedores', COUNT(*) FROM public.pagos_proveedores
UNION ALL SELECT 'productos', COUNT(*) FROM public.productos;
