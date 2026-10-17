export const normalizarProductoData = (producto = {}) => {
  const nombre = typeof producto.nombre === 'string' ? producto.nombre.trim() : '';
  const descripcion = typeof producto.descripcion === 'string' ? producto.descripcion.trim() : '';
  const lote = typeof producto.lote === 'string' ? producto.lote.trim() : producto.lote;
  const fechaVencimiento = typeof producto.fecha_vencimiento === 'string'
    ? producto.fecha_vencimiento.trim()
    : (producto.fechaVencimiento || '').toString().trim();

  return {
    codigo: (producto.codigo || '').toString().trim() || null,
    nombre,
    costo_compra: Number.parseFloat(producto.costo_compra) || 0,
    precio: Number.parseFloat(producto.precio) || 0,
    categoria: producto.categoria || null,
    stock: Number.parseInt(producto.stock, 10) || 0,
    descripcion: descripcion || null,
    activo: producto.activo !== undefined ? Boolean(producto.activo) : true,
    imagen_url: producto.imagenUrl || producto.imagen_url || null,
    imagen_public_id: producto.imagenPublicId || producto.imagen_public_id || null,
    lote: lote ? lote : null,
    fecha_vencimiento: fechaVencimiento || null,
  };
};

export const normalizarNombreProducto = (nombre = '') => (
  typeof nombre === 'string'
    ? nombre.trim().replace(/\s+/g, ' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    : ''
);

export const obtenerCostoCompraRegistrado = (producto = {}) => {
  const costos = [producto?.costo_compra, producto?.costo_de_compra]
    .map((costo) => Number.parseFloat(costo))
    .filter((costo) => Number.isFinite(costo) && costo > 0);

  return costos.length > 0 ? costos[0] : null;
};

export const normalizarProductoParaFactura = (producto = {}) => {
  const normalizado = normalizarProductoData(producto);
  const lote = normalizado.lote ?? (typeof producto.lote === 'string' ? producto.lote.trim() : producto.lote) ?? null;
  const fechaVencimiento = normalizado.fecha_vencimiento
    ?? (typeof producto.fecha_vencimiento === 'string'
      ? producto.fecha_vencimiento.trim()
      : (producto.fechaVencimiento || '').toString().trim() || null);

  return {
    ...producto,
    codigo: normalizado.codigo ?? producto.codigo ?? '',
    nombre: typeof producto.nombre === 'string' ? producto.nombre.trim() : producto.nombre || '',
    cantidad: Number.parseInt(producto.cantidad, 10) || 0,
    precio: Number.parseFloat(producto.precio ?? producto.precio_venta ?? producto.venta) || 0,
    precio_venta: Number.parseFloat(producto.precio_venta ?? producto.precio ?? producto.venta) || 0,
    costo_compra: Number.parseFloat(producto.costo_compra ?? producto.costo_de_compra ?? 0) || 0,
    costo_de_compra: Number.parseFloat(producto.costo_de_compra ?? producto.costo_compra ?? 0) || 0,
    lote,
    fecha_vencimiento: fechaVencimiento || null,
    producto_id: Object.prototype.hasOwnProperty.call(producto, 'producto_id')
      ? producto.producto_id
      : producto.id ?? null,
  };
};

export const filtrarProductosValidosParaInventario = (productos = []) => {
  if (!Array.isArray(productos)) return [];

  return productos.filter((producto) => {
    if (!producto || !producto.producto_id) return false;

    const productoId = Number(producto.producto_id);
    return Number.isFinite(productoId) && productoId > 0;
  });
};

export const obtenerDetalleProductoImpresion = (producto = {}) => {
  const partes = [];
  const lote = typeof producto.lote === 'string' ? producto.lote.trim() : producto.lote;
  const fechaVencimiento = typeof producto.fecha_vencimiento === 'string'
    ? producto.fecha_vencimiento.trim()
    : (producto.fechaVencimiento || '').toString().trim();

  if (lote) {
    partes.push(`Lote: ${lote}`);
  }

  if (fechaVencimiento) {
    const partesFecha = fechaVencimiento.split('-');
    let fechaFormateada = fechaVencimiento;

    if (partesFecha.length === 3 && partesFecha.every(parte => parte)) {
      const fechaLocal = new Date(Number(partesFecha[0]), Number(partesFecha[1]) - 1, Number(partesFecha[2]));
      if (!Number.isNaN(fechaLocal.getTime())) {
        fechaFormateada = fechaLocal.toLocaleDateString('es-CO', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      }
    } else {
      const fechaParseada = new Date(fechaVencimiento);
      if (!Number.isNaN(fechaParseada.getTime())) {
        fechaFormateada = fechaParseada.toLocaleDateString('es-CO', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      }
    }

    if (fechaFormateada !== fechaVencimiento || !Number.isNaN(new Date(fechaVencimiento).getTime())) {
      partes.push(`Vence: ${fechaFormateada}`);
    }
  }

  return partes.join(' • ');
};
