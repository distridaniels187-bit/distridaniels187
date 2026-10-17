-- Permite registrar todos los tipos de movimiento utilizados por la aplicación.
-- Ejecutar una vez en Supabase SQL Editor.
BEGIN;

ALTER TABLE public.movimientos_inventario
  DROP CONSTRAINT IF EXISTS movimientos_inventario_tipo_movimiento_check;

ALTER TABLE public.movimientos_inventario
  ADD CONSTRAINT movimientos_inventario_tipo_movimiento_check
  CHECK (
    tipo_movimiento IN (
      'venta',
      'entrada',
      'salida',
      'ajuste',
      'devolucion',
      'devolución',
      'creacion',
      'edicion'
    )
  );

COMMIT;

-- Verificar que la restricción permite registrar ventas.
SELECT
  conname AS nombre_restriccion,
  pg_get_constraintdef(oid) AS definicion
FROM pg_constraint
WHERE conrelid = 'public.movimientos_inventario'::regclass
  AND conname = 'movimientos_inventario_tipo_movimiento_check';
