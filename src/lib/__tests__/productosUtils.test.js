import {
  normalizarProductoData,
  normalizarNombreProducto,
  normalizarProductoParaFactura,
  filtrarProductosValidosParaInventario,
  obtenerDetalleProductoImpresion,
  obtenerCostoCompraRegistrado
} from '../productosUtils';

describe('normalizarProductoData', () => {
  test('normaliza nombre para buscar productos aunque cambien tildes, mayúsculas o espacios', () => {
    expect(normalizarNombreProducto('  Shampoo  NUTRIBELA Biokeratina  ')).toBe('shampoo nutribela biokeratina');
  });

  test('obtiene el costo real configurado sin confundir costo cero con costo conocido', () => {
    expect(obtenerCostoCompraRegistrado({ costo_compra: 0, costo_de_compra: '8200' })).toBe(8200);
    expect(obtenerCostoCompraRegistrado({ costo_compra: 0 })).toBeNull();
    expect(obtenerCostoCompraRegistrado(null)).toBeNull();
  });

  test('incluye lote y fecha de vencimiento en el payload final del producto', () => {
    const payload = normalizarProductoData({
      codigo: 'P-100',
      nombre: 'Ibuprofeno 400mg',
      costo_compra: '1200',
      precio: '2500',
      categoria: 'Dolor y Fiebre',
      stock: '15',
      descripcion: 'Caja de 20 tabletas',
      activo: true,
      imagenUrl: 'https://example.com/producto.jpg',
      lote: 'L-2026-09',
      fecha_vencimiento: '2026-12-31'
    });

    expect(payload).toMatchObject({
      codigo: 'P-100',
      nombre: 'Ibuprofeno 400mg',
      costo_compra: 1200,
      precio: 2500,
      categoria: 'Dolor y Fiebre',
      stock: 15,
      lote: 'L-2026-09',
      fecha_vencimiento: '2026-12-31',
      imagen_url: 'https://example.com/producto.jpg'
    });
  });

  test('normaliza valores vacíos para evitar guardar datos nulos o vacíos', () => {
    const payload = normalizarProductoData({
      nombre: 'Vitamina C',
      costo_compra: '0',
      precio: '7000',
      lote: '   ',
      fecha_vencimiento: ''
    });

    expect(payload.lote).toBeNull();
    expect(payload.fecha_vencimiento).toBeNull();
    expect(payload.stock).toBe(0);
  });

  test('genera el detalle de impresión con lote y vencimiento cuando existen', () => {
    const detalle = obtenerDetalleProductoImpresion({
      nombre: 'Antibiótico X',
      lote: 'L-2026-09',
      fecha_vencimiento: '2026-12-31'
    });

    expect(detalle).toContain('Lote: L-2026-09');
    expect(detalle).toContain('Vence: 31/12/2026');
  });

  test('preserva lote y vencimiento al preparar el producto para la factura', () => {
    const producto = normalizarProductoParaFactura({
      id: 12,
      nombre: 'Paracetamol 500mg',
      cantidad: 2,
      precio: 1200,
      precio_venta: 1200,
      costo_compra: 800,
      lote: 'L-2026-10',
      fechaVencimiento: '2027-02-15',
      producto_id: 12
    });

    expect(producto.lote).toBe('L-2026-10');
    expect(producto.fecha_vencimiento).toBe('2027-02-15');
  });

  test('no usa el id temporal de la línea como producto_id si el producto no está en catálogo', () => {
    const producto = normalizarProductoParaFactura({
      id: 999,
      nombre: 'Producto sin catálogo',
      cantidad: 1,
      producto_id: null
    });

    expect(producto.id).toBe(999);
    expect(producto.producto_id).toBeNull();
  });

  test('filtra productos sin producto_id válido para no romper la actualización de inventario', () => {
    const productos = [
      { id: 1, nombre: 'Producto válido', cantidad: 1, producto_id: 12 },
      { id: 2, nombre: 'Sin producto_id', cantidad: 1, producto_id: null },
      { id: 3, nombre: 'Producto inválido', cantidad: 1, producto_id: 'abc' },
      { id: 4, nombre: 'Otro válido', cantidad: 2, producto_id: '7' }
    ];

    const validos = filtrarProductosValidosParaInventario(productos);

    expect(validos).toHaveLength(2);
    expect(validos.map(p => p.id)).toEqual([1, 4]);
  });
});
