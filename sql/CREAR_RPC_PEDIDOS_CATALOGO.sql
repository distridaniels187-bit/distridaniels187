CREATE OR REPLACE FUNCTION public.crear_pedido_catalogo(
  p_cliente_nombre text,
  p_cliente_telefono text,
  p_direccion_entrega text,
  p_cliente_notas text,
  p_vendedor text,
  p_productos jsonb,
  p_total numeric
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  pedido_id integer;
  telefono_limpio text;
BEGIN
  IF p_cliente_nombre IS NULL
    OR pg_catalog.char_length(pg_catalog.btrim(p_cliente_nombre)) < 3
    OR pg_catalog.char_length(pg_catalog.btrim(p_cliente_nombre)) > 200 THEN
    RAISE EXCEPTION 'El nombre del cliente debe tener entre 3 y 200 caracteres'
      USING ERRCODE = '22023';
  END IF;

  telefono_limpio := pg_catalog.regexp_replace(
    COALESCE(p_cliente_telefono, ''),
    '[^0-9]',
    '',
    'g'
  );

  IF pg_catalog.char_length(telefono_limpio) < 10
    OR pg_catalog.char_length(telefono_limpio) > 15 THEN
    RAISE EXCEPTION 'El teléfono debe tener entre 10 y 15 dígitos'
      USING ERRCODE = '22023';
  END IF;

  -- La lista de vendedores se configura en src/config/empresa.js
  IF pg_catalog.char_length(pg_catalog.btrim(COALESCE(p_vendedor, ''))) < 3
    OR pg_catalog.char_length(pg_catalog.btrim(COALESCE(p_vendedor, ''))) > 100 THEN
    RAISE EXCEPTION 'El vendedor seleccionado no es válido'
      USING ERRCODE = '22023';
  END IF;

  IF p_productos IS NULL
    OR pg_catalog.jsonb_typeof(p_productos) <> 'array'
    OR pg_catalog.jsonb_array_length(p_productos) < 1
    OR pg_catalog.jsonb_array_length(p_productos) > 100 THEN
    RAISE EXCEPTION 'El pedido debe incluir entre 1 y 100 productos'
      USING ERRCODE = '22023';
  END IF;

  IF p_total IS NULL OR p_total < 0 THEN
    RAISE EXCEPTION 'El total del pedido no es válido'
      USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.pedidos (
    cliente_nombre,
    cliente_telefono,
    direccion_entrega,
    cliente_notas,
    vendedor,
    productos,
    total,
    estado
  )
  VALUES (
    pg_catalog.btrim(p_cliente_nombre),
    telefono_limpio,
    NULLIF(pg_catalog.btrim(COALESCE(p_direccion_entrega, '')), ''),
    COALESCE(NULLIF(pg_catalog.btrim(COALESCE(p_cliente_notas, '')), ''), 'Ninguna'),
    pg_catalog.btrim(p_vendedor),
    p_productos,
    p_total,
    'pendiente'
  )
  RETURNING id INTO pedido_id;

  RETURN pedido_id;
END;
$$;

REVOKE ALL ON FUNCTION public.crear_pedido_catalogo(
  text, text, text, text, text, jsonb, numeric
) FROM PUBLIC, anon, authenticated;

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.crear_pedido_catalogo(
  text, text, text, text, text, jsonb, numeric
) TO anon, authenticated;
