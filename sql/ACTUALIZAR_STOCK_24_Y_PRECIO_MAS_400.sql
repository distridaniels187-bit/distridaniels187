-- Ajuste masivo de todos los productos:
--   * Deja el stock en 24 unidades.
--   * Aumenta el precio actual (columna precio) en $400.
--   * Registra los cambios de stock en movimientos_inventario.
--
-- Ejecutar una sola vez en Supabase > SQL Editor.
-- El identificador de ejecucion evita que una segunda ejecucion vuelva a
-- aumentar los precios. Si realmente necesitas repetirlo en otro momento,
-- cambia el identificador dentro del bloque DO.

BEGIN;

LOCK TABLE public.productos IN SHARE ROW EXCLUSIVE MODE;

CREATE TABLE IF NOT EXISTS public.ajustes_masivos_productos (
  ajuste_id TEXT PRIMARY KEY,
  descripcion TEXT NOT NULL,
  productos_afectados INTEGER NOT NULL,
  ejecutado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ajustes_masivos_productos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ajustes_masivos_productos FROM anon, authenticated;

CREATE TEMP TABLE productos_antes_ajuste ON COMMIT DROP AS
SELECT id, COALESCE(stock, 0)::INTEGER AS stock_anterior
FROM public.productos;

DO $$
DECLARE
  v_ajuste_id CONSTANT TEXT := 'stock-24-precio-mas-400-2026-10-19';
  v_productos INTEGER;
BEGIN
  INSERT INTO public.ajustes_masivos_productos (
    ajuste_id,
    descripcion,
    productos_afectados
  )
  SELECT
    v_ajuste_id,
    'Stock fijado en 24 unidades y precio aumentado en 400 pesos',
    COUNT(*)::INTEGER
  FROM productos_antes_ajuste
  ON CONFLICT (ajuste_id) DO NOTHING;

  IF NOT FOUND THEN
    RAISE EXCEPTION
      'Este ajuste ya fue ejecutado. No se modifico ningun producto.';
  END IF;

  UPDATE public.productos
  SET
    stock = 24,
    precio = precio + 400,
    updated_at = now();

  GET DIAGNOSTICS v_productos = ROW_COUNT;

  UPDATE public.ajustes_masivos_productos
  SET productos_afectados = v_productos
  WHERE ajuste_id = v_ajuste_id;

  INSERT INTO public.movimientos_inventario (
    producto_id,
    tipo_movimiento,
    cantidad,
    stock_anterior,
    stock_nuevo,
    descripcion,
    motivo,
    usuario,
    fecha_movimiento
  )
  SELECT
    antes.id,
    'ajuste',
    ABS(24 - antes.stock_anterior),
    antes.stock_anterior,
    24,
    'Ajuste masivo de inventario: stock fijado en 24 unidades',
    'ajuste',
    'Ajuste masivo SQL',
    now()
  FROM productos_antes_ajuste AS antes
  WHERE antes.stock_anterior <> 24;

  RAISE NOTICE
    'Ajuste completado: % productos actualizados; stock establecido en 24 y precio aumentado en $400.',
    v_productos;
END;
$$;

COMMIT;

SELECT
  COUNT(*) AS total_productos,
  COUNT(*) FILTER (WHERE stock = 24) AS productos_con_stock_24
FROM public.productos;
