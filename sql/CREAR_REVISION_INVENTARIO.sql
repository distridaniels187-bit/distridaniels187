-- Ejecutar en Supabase SQL Editor antes de usar la pestaña "Revisión física".
-- Cada conteo se registra en el historial y el stock se ajusta en una sola transacción.

CREATE TABLE IF NOT EXISTS public.inventario_revisiones (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  producto_id BIGINT REFERENCES public.productos(id) ON DELETE SET NULL,
  producto_nombre TEXT NOT NULL,
  cantidad_sistema INTEGER NOT NULL,
  cantidad_real INTEGER NOT NULL CHECK (cantidad_real >= 0),
  diferencia INTEGER NOT NULL,
  estado_revision TEXT NOT NULL CHECK (estado_revision IN ('verificado', 'ajustado')),
  fecha_revision TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_proxima_revision TIMESTAMPTZ NOT NULL,
  revisado_por TEXT NOT NULL,
  observacion TEXT NOT NULL DEFAULT '',
  rol_usuario TEXT NOT NULL DEFAULT 'N/A',
  CONSTRAINT inventario_revisiones_diferencia_check
    CHECK (diferencia = cantidad_real - cantidad_sistema)
);

CREATE INDEX IF NOT EXISTS idx_inventario_revisiones_producto_fecha
  ON public.inventario_revisiones (producto_id, fecha_revision DESC);

ALTER TABLE public.inventario_revisiones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read all inventory reviews" ON public.inventario_revisiones;
CREATE POLICY "Allow read all inventory reviews"
  ON public.inventario_revisiones FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert inventory reviews" ON public.inventario_revisiones;
CREATE POLICY "Allow insert inventory reviews"
  ON public.inventario_revisiones FOR INSERT WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.obtener_ultimas_revisiones_inventario()
RETURNS SETOF public.inventario_revisiones
LANGUAGE sql
STABLE
AS $$
  SELECT DISTINCT ON (producto_id) *
  FROM public.inventario_revisiones
  WHERE producto_id IS NOT NULL
  ORDER BY producto_id, fecha_revision DESC, id DESC;
$$;

CREATE OR REPLACE FUNCTION public.guardar_revision_inventario(
  p_producto_id BIGINT,
  p_stock_sistema INTEGER,
  p_stock_real INTEGER,
  p_revisado_por TEXT,
  p_rol_usuario TEXT DEFAULT 'N/A',
  p_observacion TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  producto_actual public.productos%ROWTYPE;
  diferencia_calculada INTEGER;
  estado_calculado TEXT;
  revision_id BIGINT;
BEGIN
  IF p_stock_sistema < 0 OR p_stock_real < 0 THEN
    RAISE EXCEPTION 'Las cantidades de inventario no pueden ser negativas';
  END IF;

  SELECT *
  INTO producto_actual
  FROM public.productos
  WHERE id = p_producto_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No existe el producto %', p_producto_id;
  END IF;

  IF COALESCE(producto_actual.stock, 0)::INTEGER <> p_stock_sistema THEN
    RAISE EXCEPTION 'El stock cambió desde que se cargó el conteo. Actualiza y vuelve a verificarlo';
  END IF;

  diferencia_calculada := p_stock_real - p_stock_sistema;
  estado_calculado := CASE WHEN diferencia_calculada = 0 THEN 'verificado' ELSE 'ajustado' END;

  UPDATE public.productos
  SET stock = p_stock_real
  WHERE id = p_producto_id;

  INSERT INTO public.inventario_revisiones (
    producto_id,
    producto_nombre,
    cantidad_sistema,
    cantidad_real,
    diferencia,
    estado_revision,
    fecha_proxima_revision,
    revisado_por,
    observacion,
    rol_usuario
  )
  VALUES (
    p_producto_id,
    producto_actual.nombre,
    p_stock_sistema,
    p_stock_real,
    diferencia_calculada,
    estado_calculado,
    now() + interval '90 days',
    COALESCE(NULLIF(p_revisado_por, ''), 'Sistema'),
    COALESCE(p_observacion, ''),
    COALESCE(NULLIF(p_rol_usuario, ''), 'N/A')
  )
  RETURNING id INTO revision_id;

  RETURN jsonb_build_object(
    'revision_id', revision_id,
    'stock_anterior', p_stock_sistema,
    'stock_nuevo', p_stock_real,
    'diferencia', diferencia_calculada,
    'estado_revision', estado_calculado
  );
END;
$$;
