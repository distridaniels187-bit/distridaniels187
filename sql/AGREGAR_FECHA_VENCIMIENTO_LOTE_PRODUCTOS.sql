ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS lote TEXT,
  ADD COLUMN IF NOT EXISTS fecha_vencimiento DATE;

-- opcional: ajustar registros previamente guardados
UPDATE productos
SET lote = NULL
WHERE lote IS NULL;

UPDATE productos
SET fecha_vencimiento = NULL
WHERE fecha_vencimiento IS NULL;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'productos'
  AND column_name IN ('lote', 'fecha_vencimiento')
ORDER BY column_name;
