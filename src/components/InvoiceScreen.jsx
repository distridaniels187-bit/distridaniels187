import React, { useState, useEffect } from 'react';
import { EMPRESA, VENDEDORES } from '../config/empresa';
import { useNavigate, useLocation } from 'react-router-dom';
import FacturaPreview from './FacturaPreview';
import ClientesScreen from './ClientesScreen';
import { supabase } from './supabaseClient';
import './InvoiceScreen.css';
import { useAuth } from '../context/auth-context';
import {
  normalizarNombreProducto,
  normalizarProductoParaFactura,
  obtenerCostoCompraRegistrado
} from '../lib/productosUtils';

const getLocalDateForInput = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const InvoiceScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Estados principales
  const [cliente, setCliente] = useState('');
  const [fecha, setFecha] = useState(getLocalDateForInput());
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [productos, setProductos] = useState([]);
  const [nombreProducto, setNombreProducto] = useState('');
  const [cantidadProducto, setCantidadProducto] = useState('');
  const [precioProducto, setPrecioProducto] = useState('');
  const [loteProducto, setLoteProducto] = useState('');
  const [fechaVencimientoProducto, setFechaVencimientoProducto] = useState('');
  const [vendedorSeleccionado, setVendedorSeleccionado] = useState('');
  
  // Estados para vistas modales
  const [mostrarVistaPrevia, setMostrarVistaPrevia] = useState(false);
  const [mostrarCatalogo, setMostrarCatalogo] = useState(false);
  const [mostrarClientes, setMostrarClientes] = useState(false);
  
  // Estados para catálogo
  const [productosCatalogo, setProductosCatalogo] = useState([]);
  const [busquedaCatalogo, setBusquedaCatalogo] = useState('');
  
  // Estados para edición
  const [editandoProductoId, setEditandoProductoId] = useState(null);
  const [cantidadEditada, setCantidadEditada] = useState('');
  
  // Estados para clientes
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [erroresStock, setErroresStock] = useState({});
  const [notaCliente, setNotaCliente] = useState('');
  const [pedidoOrigenId, setPedidoOrigenId] = useState(null);
  
  // Estados para vista de productos agregados
  const [vistaProductosAgregados, setVistaProductosAgregados] = useState('grid'); // 'grid' o 'list'

  const vendedores = VENDEDORES.map((v) => v.nombre);

  const buscarProductoCatalogo = (producto) => {
    const nombreNormalizado = normalizarNombreProducto(producto?.nombre);
    const id = Number(producto?.producto_id || producto?.id);
    if (Number.isFinite(id) && id > 0) {
      const productoPorId = productosCatalogo.find((item) => Number(item.id) === id);
      if (
        productoPorId
        && (!nombreNormalizado || normalizarNombreProducto(productoPorId.nombre) === nombreNormalizado)
      ) {
        return productoPorId;
      }
    }

    if (!nombreNormalizado) return null;

    const coincidencias = productosCatalogo.filter(
      (item) => normalizarNombreProducto(item.nombre) === nombreNormalizado
    );
    return coincidencias.length === 1 ? coincidencias[0] : null;
  };

  // Cargar datos del pedido si vienen desde GestionPedidos
  useEffect(() => {
    if (location.state?.pedidoData) {
      const { pedidoData } = location.state;
      setPedidoOrigenId(pedidoData.pedido_id || null);
      setCliente(pedidoData.cliente || '');
      setTelefono(pedidoData.telefono || '');
      setDireccion(pedidoData.direccion || '');
      setCorreo(pedidoData.correo || '');
      setVendedorSeleccionado(pedidoData.vendedor || '');
      setProductos((pedidoData.productos || []).map(normalizarProductoParaFactura));
      setNotaCliente(
        pedidoData.cliente_notas && pedidoData.cliente_notas !== 'Ninguna'
          ? pedidoData.cliente_notas
          : ''
      );
      
      // Limpiar el state para que no se recargue al volver
      window.history.replaceState({}, document.title);
      
      // Mostrar mensaje de confirmación
      setTimeout(() => {
        alert('✅ Pedido cargado exitosamente\n\nPuedes modificar los datos antes de guardar la factura.');
      }, 100);
    }
  }, [location.state]);

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      try {
        setCargando(true);
        
        // Cargar productos del catálogo
        const { data: productosData, error: productosError } = await supabase
          .from('productos')
          .select('*')
          .order('nombre', { ascending: true });
        
        if (productosError) throw productosError;
        setProductosCatalogo(productosData || []);
        
        // Cargar clientes
        const { data: clientesData, error: clientesError } = await supabase
          .from('clientes')
          .select('*')
          .order('nombre', { ascending: true });
        
        if (clientesError) throw clientesError;
        setClientes(clientesData || []);
        
      } catch (error) {
        console.error('Error cargando datos iniciales:', error);
        alert('Error al cargar datos iniciales');
      } finally {
        setCargando(false);
      }
    };
    
    cargarDatosIniciales();
  }, []);

  // Sincronizar productos cargados (desde pedido) con catálogo para obtener producto_id
  useEffect(() => {
    if (!productosCatalogo.length) return;
    const haySinId = productos.some(p => !p.producto_id);
    if (!haySinId) return;

    let huboCambios = false;
    const productosActualizados = productos.map(p => {
      if (p.producto_id) return p;

      const coincidencia = buscarProductoCatalogo(p);

      if (!coincidencia) return p;
      huboCambios = true;
      return normalizarProductoParaFactura({
        ...p,
        producto_id: coincidencia.id,
        codigo: p.codigo || coincidencia.codigo || '',
        precio: p.precio ?? coincidencia.precio ?? coincidencia.venta ?? 0,
        precio_venta: p.precio_venta ?? p.precio ?? coincidencia.precio ?? coincidencia.venta ?? 0,
        costo_compra: p.costo_compra ?? coincidencia.costo_compra ?? coincidencia.costo_de_compra ?? 0,
        costo_de_compra: p.costo_de_compra ?? coincidencia.costo_de_compra ?? coincidencia.costo_compra ?? 0,
        lote: p.lote ?? coincidencia.lote ?? null,
        fecha_vencimiento: p.fecha_vencimiento ?? p.fechaVencimiento ?? coincidencia.fecha_vencimiento ?? coincidencia.fechaVencimiento ?? null
      });
    });

    if (huboCambios) {
      setProductos(productosActualizados.map((p) => calcularMetricasRentabilidad(p)));
    }
  }, [productosCatalogo, productos]);

  const toNumber = (valor) => {
    const parsed = parseFloat(valor);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const calcularMetricasRentabilidad = (producto, cantidadForzada = null) => {
    const cantidad = cantidadForzada ?? (parseInt(producto.cantidad, 10) || 0);
    const precioVenta = toNumber(producto.precio_venta ?? producto.precio ?? producto.venta);
    const catalogo = buscarProductoCatalogo(producto);
    const costoCompra = obtenerCostoCompraRegistrado(producto)
      ?? obtenerCostoCompraRegistrado(catalogo);
    const utilidadUnitaria = costoCompra === null ? null : precioVenta - costoCompra;

    return {
      ...producto,
      cantidad,
      precio: precioVenta,
      precio_venta: precioVenta,
      costo_compra: costoCompra ?? 0,
      costo_de_compra: costoCompra ?? 0,
      costo_compra_configurado: costoCompra !== null,
      utilidad_unitaria: utilidadUnitaria,
      utilidad_total: utilidadUnitaria === null ? null : utilidadUnitaria * cantidad
    };
  };

  // Función para verificar stock disponible
  const verificarStockDisponible = (productoId, cantidadRequerida) => {
    const producto = productosCatalogo.find(p => p.id === productoId);
    if (!producto) return 0;
    
    // Verificar si hay stock definido (puede ser null/undefined)
    const stockActual = producto.stock !== null && producto.stock !== undefined 
      ? producto.stock 
      : Infinity;
    
    // Retornar la diferencia real; si es < 0 no hay suficiente stock
    return stockActual - cantidadRequerida;
  };

  // Función para agregar producto manualmente
  const agregarProducto = () => {
    if (!nombreProducto || !cantidadProducto || !precioProducto) {
      alert('Complete todos los campos del producto');
      return;
    }

    const cantidad = parseInt(cantidadProducto);
    const precio = parseFloat(precioProducto);

    if (isNaN(cantidad) || cantidad <= 0) {
      alert('Ingrese una cantidad válida');
      return;
    }

    if (isNaN(precio) || precio <= 0) {
      alert('Ingrese un precio válido');
      return;
    }

    // Buscar el producto en el catálogo para verificar stock
    const productoCatalogo = buscarProductoCatalogo({ nombre: nombreProducto });

    if (productoCatalogo && productoCatalogo.stock !== null && productoCatalogo.stock !== undefined) {
      const stockDisponible = verificarStockDisponible(productoCatalogo.id, cantidad);
      
      if (stockDisponible < 0) {
        alert(`No hay suficiente stock. Solo quedan ${productoCatalogo.stock} unidades.`);
        return;
      }
    }

    const nuevoProducto = normalizarProductoParaFactura({
      id: Date.now(),
      nombre: nombreProducto,
      cantidad: cantidad,
      precio: precio,
      precio_venta: precio,
      costo_compra: toNumber(productoCatalogo?.costo_compra ?? productoCatalogo?.costo_de_compra),
      costo_de_compra: toNumber(productoCatalogo?.costo_de_compra ?? productoCatalogo?.costo_compra),
      costo_compra_configurado: obtenerCostoCompraRegistrado(productoCatalogo) !== null,
      producto_id: productoCatalogo?.id || null,
      lote: (loteProducto || productoCatalogo?.lote || '').trim() || null,
      fecha_vencimiento: fechaVencimientoProducto || productoCatalogo?.fecha_vencimiento || productoCatalogo?.fechaVencimiento || null
    });

    setProductos([...productos, calcularMetricasRentabilidad(nuevoProducto)]);
    setNombreProducto('');
    setCantidadProducto('');
    setPrecioProducto('');
    setLoteProducto('');
    setFechaVencimientoProducto('');
    setErroresStock({});
  };

  // Función para agregar desde catálogo
  const agregarProductoDesdeCatalogo = (producto) => {
    if (!producto || !producto.nombre || !producto.precio) {
      console.error('Producto inválido:', producto);
      return;
    }

    // Verificar stock antes de agregar
    if (producto.stock !== null && producto.stock !== undefined && producto.stock <= 0) {
      alert('No hay stock disponible para este producto');
      return;
    }

    setProductos(prevProductos => {
      const existe = prevProductos.find(p => p.producto_id === producto.id);
      
      if (existe) {
        // Verificar si al aumentar la cantidad se supera el stock
        const nuevaCantidad = existe.cantidad + 1;
        const stockDisponible = verificarStockDisponible(producto.id, nuevaCantidad);
        
        if (stockDisponible < 0) {
          alert(`No hay suficiente stock. Solo quedan ${producto.stock} unidades.`);
          return prevProductos;
        }
        
        return prevProductos.map(p => 
          p.producto_id === producto.id 
            ? calcularMetricasRentabilidad({ ...p, cantidad: nuevaCantidad }) 
            : p
        );
      }
      
      // Verificar stock para nuevo producto
      const stockDisponible = verificarStockDisponible(producto.id, 1);
      if (stockDisponible < 0) {
        alert(`No hay suficiente stock. Solo quedan ${producto.stock} unidades.`);
        return prevProductos;
      }
      
      return [
        ...prevProductos,
        normalizarProductoParaFactura({
          id: producto.id || Date.now(),
          nombre: producto.nombre,
          cantidad: 1,
          precio: producto.precio ?? producto.venta,
          precio_venta: producto.precio ?? producto.venta,
          costo_compra: toNumber(producto.costo_compra ?? producto.costo_de_compra),
          costo_de_compra: toNumber(producto.costo_de_compra ?? producto.costo_compra),
          codigo: producto.codigo || '',
          producto_id: producto.id,
          lote: producto.lote ?? null,
          fecha_vencimiento: producto.fecha_vencimiento ?? producto.fechaVencimiento ?? null
        })
      ].map((p) => calcularMetricasRentabilidad(p));
    });
    
    setErroresStock({});
    setMostrarCatalogo(false);
  };

  // Función para registrar movimiento de inventario (auditoría)
  const registrarMovimientoInventario = async (
    productoId,
    tipoMovimiento,
    cantidadMovida,
    stockAnterior,
    stockNuevo,
    facturaId = null,
    descripcion = null,
    usuario = 'Sistema',
    rolUsuario = 'N/A'
  ) => {
    try {
      const { error } = await supabase
        .from('movimientos_inventario')
        .insert([{
          producto_id: productoId,
          tipo_movimiento: tipoMovimiento,
          cantidad: cantidadMovida,
          stock_anterior: stockAnterior,
          stock_nuevo: stockNuevo,
          factura_id: facturaId,
          descripcion: descripcion,
          usuario: usuario,
          rol_usuario: rolUsuario,
          fecha_movimiento: new Date().toISOString()
        }]);

      if (error) {
        console.error('Error registrando movimiento de inventario:', error);
        return { success: false, error };
      }
      return { success: true, error: null };
    } catch (error) {
      console.error('Error en registrarMovimientoInventario:', error);
      return { success: false, error };
    }
  };

  // Función para actualizar inventario después de una venta
  const actualizarInventario = async (productosVendidos, facturaId = null) => {
    const errores = [];

    for (const producto of productosVendidos) {
      try {
        const productoCatalogo = buscarProductoCatalogo(producto);
        const productoId = Number(productoCatalogo?.id);
        const cantidad = Number(producto.cantidad);

        if (!Number.isFinite(productoId) || productoId <= 0 || !Number.isFinite(cantidad) || cantidad <= 0) {
          errores.push(
            `${producto.nombre || 'Producto sin nombre'}: no se encontró un único producto coincidente en el catálogo`
          );
          continue;
        }

        const { data: productoActual, error } = await supabase
          .from('productos')
          .select('id, nombre, stock, activo')
          .eq('id', productoId)
          .single();

        if (error || !productoActual) {
          console.error(`No se pudo consultar el stock de ${producto.nombre}:`, error);
          errores.push(`${producto.nombre}: no se pudo consultar el stock`);
          continue;
        }

        if (normalizarNombreProducto(productoActual.nombre) !== normalizarNombreProducto(producto.nombre)) {
          console.error('El producto de la factura no coincide con el producto consultado en inventario', {
            productoFactura: producto.nombre,
            productoInventario: productoActual.nombre,
            productoId
          });
          errores.push(`${producto.nombre}: el ID asociado corresponde a otro producto; no se modificó el inventario`);
          continue;
        }

        const stockActual = Number(productoActual.stock) || 0;
        const nuevoStock = Math.max(0, stockActual - cantidad);

        const resultadoMovimiento = await registrarMovimientoInventario(
          productoId,
          'venta',
          cantidad,
          stockActual,
          nuevoStock,
          facturaId,
          `Venta de ${cantidad} unidades de ${producto.nombre}`,
          vendedorSeleccionado || user?.username || 'Sistema',
          user?.role || 'N/A'
        );

        const { data: productoVerificado, error: verificacionError } = await supabase
          .from('productos')
          .select('stock')
          .eq('id', productoId)
          .single();

        if (verificacionError || !productoVerificado) {
          console.error(`No se pudo verificar el stock de ${producto.nombre}:`, verificacionError);
          errores.push(`${producto.nombre}: el movimiento se guardó, pero no se pudo verificar el stock`);
          continue;
        }

        let stockFinal = Number(productoVerificado.stock);
        if (!resultadoMovimiento.success) {
          const { data: productoAjustado, error: ajusteError } = await supabase
            .from('productos')
            .update({
              stock: nuevoStock,
              activo: nuevoStock > 0 ? productoActual.activo : false
            })
            .eq('id', productoId)
            .select('stock')
            .maybeSingle();

          if (ajusteError || !productoAjustado) {
            console.error(`No se pudo ajustar el stock de ${producto.nombre}:`, ajusteError);
            errores.push(
              `${producto.nombre}: el inventario quedó en ${stockFinal} (antes ${stockActual}; debía quedar ${nuevoStock}), ` +
              'pero no se pudo corregir el stock tras el error del historial'
            );
          } else {
            stockFinal = Number(productoAjustado.stock);
            const detalleError = resultadoMovimiento.error?.message
              ? `: ${resultadoMovimiento.error.message}`
              : '';
            errores.push(
              `${producto.nombre}: el inventario quedó en ${stockFinal} (antes ${stockActual}; debía quedar ${nuevoStock}), ` +
              `pero no se guardó el movimiento en el historial${detalleError}`
            );
          }
          continue;
        }

        if (stockFinal !== nuevoStock) {
          console.warn(`Corrigiendo stock después de la factura ${facturaId}`, {
            producto: producto.nombre,
            esperado: nuevoStock,
            actual: stockFinal,
            movimientoRegistrado: resultadoMovimiento.success
          });

          const { data: productoCorregido, error: correccionError } = await supabase
            .from('productos')
            .update({
              stock: nuevoStock,
              activo: nuevoStock > 0 ? productoActual.activo : false
            })
            .eq('id', productoId)
            .eq('stock', stockFinal)
            .select('stock')
            .maybeSingle();

          if (correccionError || !productoCorregido) {
            console.error(`No se pudo reconciliar el stock de ${producto.nombre}:`, correccionError);
            errores.push(
              `${producto.nombre}: se esperaba stock ${nuevoStock}, pero no se pudo confirmar la corrección. ` +
              'No vuelvas a guardar la factura.'
            );
            continue;
          }

          stockFinal = Number(productoCorregido.stock);
          if (stockFinal !== nuevoStock) {
            errores.push(
              `${producto.nombre}: el stock quedó en ${stockFinal} y se esperaba ${nuevoStock}. ` +
              'No vuelvas a guardar la factura.'
            );
            continue;
          }
        }

        if (nuevoStock === 0 && productoActual.activo) {
          const { error: desactivarError } = await supabase
            .from('productos')
            .update({ activo: false })
            .eq('id', productoId);

          if (desactivarError) {
            console.error(`No se pudo desactivar el producto agotado ${producto.nombre}:`, desactivarError);
            errores.push(`${producto.nombre}: stock actualizado, pero no se pudo desactivar`);
          }
        }

        console.log(`Stock actualizado para ${producto.nombre}: ${stockActual} -> ${nuevoStock}`);
      } catch (error) {
        console.error(`Error actualizando inventario de ${producto.nombre || 'producto'}:`, error);
        errores.push(`${producto.nombre || 'Producto sin nombre'}: error inesperado al actualizar`);
      }
    }

    return errores;
  };

  // Funciones para gestión de productos
  const eliminarProducto = (id) => {
    setProductos(productos.filter(p => p.id !== id));
    setErroresStock(prev => {
      const newErrors = { ...prev };
      delete newErrors[id];
      return newErrors;
    });
  };

  // Función para actualizar cantidad rápidamente
  const actualizarCantidadRapida = (productoId, incremento) => {
    const producto = productos.find(p => p.id === productoId);
    if (!producto) return;

    const nuevaCantidad = Math.max(1, producto.cantidad + incremento);

    // Verificar stock si es un producto del catálogo
    if (producto.producto_id) {
      const stockDisponible = verificarStockDisponible(producto.producto_id, nuevaCantidad);
      
      if (stockDisponible < 0) {
        const productoCatalogo = productosCatalogo.find(p => p.id === producto.producto_id);
        alert(`No hay suficiente stock. Solo quedan ${productoCatalogo.stock} unidades.`);
        return;
      }
    }

    const productosActualizados = productos.map(p => 
      p.id === productoId ? calcularMetricasRentabilidad({ ...p, cantidad: nuevaCantidad }) : p
    );
    
    setProductos(productosActualizados);
    setErroresStock(prev => {
      const newErrors = { ...prev };
      delete newErrors[productoId];
      return newErrors;
    });
  };

  // Función para sumar docenas acumulativamente (+12 y +24)
  const sumarDocenas = (productoId, cantidadASumar) => {
    const producto = productos.find(p => p.id === productoId);
    if (!producto) return;

    // Sumar la cantidad a la cantidad actual (acumulativo)
    const nuevaCantidad = producto.cantidad + cantidadASumar;

    // Verificar stock si es un producto del catálogo
    if (producto.producto_id) {
      const stockDisponible = verificarStockDisponible(producto.producto_id, nuevaCantidad);
      
      if (stockDisponible < 0) {
        const productoCatalogo = productosCatalogo.find(p => p.id === producto.producto_id);
        alert(`No hay suficiente stock. Solo quedan ${productoCatalogo.stock} unidades.`);
        return;
      }
    }

    const productosActualizados = productos.map(p => 
      p.id === productoId ? calcularMetricasRentabilidad({ ...p, cantidad: nuevaCantidad }) : p
    );
    
    setProductos(productosActualizados);
    setErroresStock(prev => {
      const newErrors = { ...prev };
      delete newErrors[productoId];
      return newErrors;
    });
  };

  const iniciarEdicionCantidad = (producto) => {
    setEditandoProductoId(producto.id);
    setCantidadEditada(producto.cantidad.toString());
  };

  const guardarEdicionCantidad = (id) => {
    const cantidad = parseInt(cantidadEditada);
    if (isNaN(cantidad) || cantidad <= 0) {
      alert('Ingrese una cantidad válida');
      return;
    }

    const producto = productos.find(p => p.id === id);
    if (!producto) return;

    // Verificar stock si es un producto del catálogo
    if (producto.producto_id) {
      const stockDisponible = verificarStockDisponible(producto.producto_id, cantidad);
      
      if (stockDisponible < 0) {
        const productoCatalogo = productosCatalogo.find(p => p.id === producto.producto_id);
        alert(`No hay suficiente stock. Solo quedan ${productoCatalogo.stock} unidades.`);
        return;
      }
    }

    const productosActualizados = productos.map(p => 
      p.id === id ? calcularMetricasRentabilidad({ ...p, cantidad }) : p
    );
    
    setProductos(productosActualizados);
    setEditandoProductoId(null);
    setCantidadEditada('');
    setErroresStock(prev => {
      const newErrors = { ...prev };
      delete newErrors[id];
      return newErrors;
    });
  };

  const cancelarEdicion = () => {
    setEditandoProductoId(null);
    setCantidadEditada('');
  };

  // Función para verificar stock antes de mostrar la vista previa
  const verificarStockAntesDeVenta = () => {
    const errores = {};
    
    for (const producto of productos) {
      if (producto.producto_id) {
        const stockDisponible = verificarStockDisponible(producto.producto_id, producto.cantidad);
        
        if (stockDisponible < 0) {
          const productoCatalogo = productosCatalogo.find(p => p.id === producto.producto_id);
          errores[producto.id] = `Solo ${productoCatalogo.stock} disponibles`;
        }
      }
    }
    
    setErroresStock(errores);
    return Object.keys(errores).length === 0;
  };

  // Funciones para factura
  const mostrarPrevia = () => {
    if (!cliente || productos.length === 0 || !vendedorSeleccionado) {
      alert('Complete cliente, vendedor y agregue productos');
      return;
    }
    
    // Verificar stock antes de continuar
    if (!verificarStockAntesDeVenta()) {
      alert('Hay problemas de stock con algunos productos. Revise las cantidades.');
      return;
    }
    
    setMostrarVistaPrevia(true);
  };

  // Función para limpiar el formulario
  const limpiarFormulario = () => {
    setCliente('');
    setFecha(getLocalDateForInput());
    setDireccion('');
    setTelefono('');
    setCorreo('');
    setProductos([]);
    setVendedorSeleccionado('');
    setNotaCliente('');
    setPedidoOrigenId(null);
    setLoteProducto('');
    setFechaVencimientoProducto('');
    setErroresStock({});
  };

  // ⭐⭐ MODIFICACIÓN - Función guardarFactura con opción de imprimir ⭐⭐
  const guardarFactura = async () => {
    try {
      setCargando(true);
      
      const productosConRentabilidad = productos.map((p) => calcularMetricasRentabilidad(p));
      const notaClienteLimpia = (notaCliente || '').trim();
      const productosConNotaCliente = productosConRentabilidad.map((producto, index) => (
        index === 0
          ? { ...producto, nota_cliente: notaClienteLimpia || null }
          : producto
      ));
      const facturaData = {
        cliente,
        fecha,
        vendedor: vendedorSeleccionado,
        direccion: direccion || null,
        telefono: telefono || null,
        correo: correo || null,
        productos: productosConNotaCliente,
        total: productosConNotaCliente.reduce((sum, p) => sum + (p.cantidad * p.precio), 0),
      };

      const { data, error } = await supabase
        .from('facturas')
        .insert([{
          cliente: facturaData.cliente,
          fecha: facturaData.fecha,
          vendedor: facturaData.vendedor,
          direccion: facturaData.direccion,
          telefono: facturaData.telefono,
          correo: facturaData.correo,
          productos: facturaData.productos,
          total: facturaData.total
        }])
        .select();

      if (error) throw error;

      // Obtener el ID de la factura guardada
      const facturaGuardada = data[0];
      const numeroFactura = facturaGuardada.id;

      // Actualizar inventario después de guardar la factura (pasando el facturaId)
      const erroresInventario = await actualizarInventario(productos, numeroFactura);
      if (erroresInventario.length > 0) {
        alert(
          `⚠️ La factura #${numeroFactura} se guardó, pero hubo problemas con el inventario:\n\n` +
          erroresInventario.map((detalle) => `• ${detalle}`).join('\n') +
          '\n\nNo vuelvas a guardar la factura. Verifica el stock y el historial de movimientos.'
        );
      }

      // Si la factura viene de Gestión de Pedidos, marcar ese pedido como entregado
      if (pedidoOrigenId) {
        const { error: pedidoError } = await supabase
          .from('pedidos')
          .update({
            estado: 'entregado',
            fecha_actualizacion: new Date().toISOString()
          })
          .eq('id', pedidoOrigenId);

        if (pedidoError) {
          console.error('Error actualizando estado del pedido al facturar:', pedidoError);
          alert(`⚠️ Factura guardada, pero no se pudo actualizar el estado del pedido #${pedidoOrigenId}.\n\nActualízalo manualmente en Gestión de Pedidos.`);
        }
      }

      // Mostrar diálogo de confirmación con opción de imprimir
      const usuarioQuiereImprimir = window.confirm(
        `✅ Factura guardada exitosamente!\n\nN° Factura: ${numeroFactura}\nCliente: ${cliente}\nTotal Venta: $${facturaData.total.toFixed(2)}` +
        '\n\n¿Deseas imprimir la factura ahora?'
      );

      setMostrarVistaPrevia(false);
      
      if (usuarioQuiereImprimir) {
        // Navegar a la vista de detalle para imprimir
        navigate(`/factura/${numeroFactura}`);
      } else {
        // Limpiar formulario si no quiere imprimir
        limpiarFormulario();
      }
      
    } catch (error) {
      console.error('Error guardando factura:', error);
      alert('Error al guardar la factura: ' + error.message);
    } finally {
      setCargando(false);
    }
  };

  // Función para seleccionar cliente
  const seleccionarCliente = (cliente) => {
    setCliente(cliente.nombre);
    setDireccion(cliente.direccion || '');
    setTelefono(cliente.telefono || '');
    setCorreo(cliente.correo || '');
    setMostrarClientes(false);
  };

  // Filtros
  const productosFiltrados = productosCatalogo.filter(producto => 
    producto.nombre.toLowerCase().includes(busquedaCatalogo.toLowerCase()) ||
    (producto.codigo && producto.codigo.toLowerCase().includes(busquedaCatalogo.toLowerCase()))
  );

  // Calcular total
  const total = productos.reduce((sum, p) => sum + (p.cantidad * p.precio), 0);
  const utilidadTotal = productos.every((producto) => producto.costo_compra_configurado !== false
    && obtenerCostoCompraRegistrado(producto) !== null)
    ? productos.reduce((sum, p) => sum + (p.utilidad_total || 0), 0)
    : null;

  return (
    <div className="invoice-container">
      {/* Vista Previa de Factura */}
      {mostrarVistaPrevia && (
        <FacturaPreview
          factura={{
            cliente,
            fecha,
            vendedor: vendedorSeleccionado,
            direccion,
            telefono,
            correo,
            notaCliente,
            productos,
            total: total,
          }}
          onVolver={() => setMostrarVistaPrevia(false)}
          onGuardar={guardarFactura}
          cargando={cargando}
        />
      )}

      {/* Modal de Catálogo */}
      {mostrarCatalogo && (
        <div className="catalogo-modal">
          <div className="catalogo-content">
            <div className="catalogo-header">
              <h2>Catálogo de Productos</h2>
              <button 
                className="button secondary-button"
                onClick={() => setMostrarCatalogo(false)}
              >
                Cerrar
              </button>
            </div>
            
            <div className="catalogo-search">
              <input
                type="text"
                placeholder="🔍 Buscar producto..."
                value={busquedaCatalogo}
                onChange={(e) => setBusquedaCatalogo(e.target.value)}
                className="search-input"
              />
            </div>
            
            <div className="productos-catalogo-list">
              {productosFiltrados.length > 0 ? (
                productosFiltrados.map(producto => (
                  <div 
                    key={producto.id} 
                    className={`producto-catalogo-item ${producto.stock === 0 ? 'sin-stock' : ''}`}
                    onClick={() => producto.stock !== 0 && agregarProductoDesdeCatalogo(producto)}
                  >
                    <div className="producto-info">
                      <h4>{producto.nombre}</h4>
                      {producto.codigo && <span className="producto-codigo">#{producto.codigo}</span>}
                    </div>
                    <div className="producto-details">
                      <div className="producto-precio">
                        ${producto.precio?.toFixed(2) || '0.00'}
                      </div>
                      <div className={`producto-stock ${producto.stock === 0 ? 'stock-agotado' : producto.stock < 5 ? 'stock-bajo' : 'stock-disponible'}`}>
                        {producto.stock !== null ? `${producto.stock} disponibles` : 'Stock ilimitado'}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-catalogo">
                  <p>No se encontraron productos</p>
                  <button 
                    className="button primary-button"
                    onClick={() => {
                      setMostrarCatalogo(false);
                      navigate('/catalogo');
                    }}
                  >
                    Administrar Catálogo
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Clientes */}
      {mostrarClientes && (
        <ClientesScreen 
          onSeleccionarCliente={seleccionarCliente}
          onVolver={() => setMostrarClientes(false)}
          clientes={clientes}
        />
      )}

      {/* Formulario Principal */}
      {!mostrarVistaPrevia && !mostrarCatalogo && !mostrarClientes && (
        <>
          <h1>PEDIDO {EMPRESA.nombreCorto}</h1>

          {/* Botón de seleccionar cliente */}
          <div className="form-row">
            <div className="form-group">
              <button 
                className="button info-button"
                onClick={() => setMostrarClientes(true)}
              >
                <i className="fas fa-users"></i> Seleccionar Cliente
              </button>
            </div>
          </div>

          {/* Información del cliente */}
          <div className="customer-info-section">
            <div className="form-row">
              <div className="form-group cliente-group" style={{flex: 2}}>
                <input
                  type="text"
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                  placeholder="Nombre del cliente *"
                  required
                  className={!cliente ? 'input-error' : ''}
                />
              </div>
              <div className="form-group" style={{flex: 1}}>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="date-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group" style={{flex: 2}}>
                <input
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Dirección Opcional"
                />
              </div>
              <div className="form-group" style={{flex: 1}}>
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Teléfono Opcional"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group" style={{flex: 1}}>
                <input
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="Email Opcional"
                />
              </div>
              <div className="form-group" style={{flex: 1}}>
                <select
                  value={vendedorSeleccionado}
                  onChange={(e) => setVendedorSeleccionado(e.target.value)}
                  required
                  className={!vendedorSeleccionado ? 'input-error' : ''}
                >
                  <option value="">Seleccione vendedor *</option>
                  {vendedores.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Sección de productos */}
          <div className="products-main-section">
            <div className="add-products-section">
              <h3>Agregar Producto:</h3>
              <div className="product-form-row">
                <input
                  type="text"
                  value={nombreProducto}
                  onChange={(e) => setNombreProducto(e.target.value)}
                  placeholder="Nombre *"
                  className="product-input"
                />
                <input
                  type="number"
                  value={cantidadProducto}
                  onChange={(e) => setCantidadProducto(e.target.value)}
                  placeholder="Cantidad *"
                  min="1"
                  className="product-input"
                />
                <input
                  type="number"
                  value={precioProducto}
                  onChange={(e) => setPrecioProducto(e.target.value)}
                  placeholder="Precio *"
                  min="0"
                  step="0.01"
                  className="product-input"
                />
                <input
                  type="text"
                  value={loteProducto}
                  onChange={(e) => setLoteProducto(e.target.value)}
                  placeholder="Lote"
                  className="product-input"
                />
                <input
                  type="date"
                  value={fechaVencimientoProducto}
                  onChange={(e) => setFechaVencimientoProducto(e.target.value)}
                  placeholder="Vence"
                  className="product-input"
                />
                <button className="button add-product-button" onClick={agregarProducto}>
                  Agregar
                </button>
                <button 
                  className="button primary-button catalog-button"
                  onClick={() => setMostrarCatalogo(true)}
                >
                  <i className="fas fa-book"></i> Catálogo
                </button>
              </div>
            </div>

            {/* Lista de productos */}
            {productos.length > 0 && (
              <div className="productos-list-expanded">
                <div className="productos-header">
                  <h3>Productos Agregados ({productos.length})</h3>
                  <div className="view-controls-container">
                    <button
                      className={`view-toggle-btn ${vistaProductosAgregados === 'grid' ? 'active' : ''}`}
                      onClick={() => setVistaProductosAgregados('grid')}
                      title="Vista cuadrícula"
                    >
                      <i className="fas fa-th"></i>
                    </button>
                    <button
                      className={`view-toggle-btn ${vistaProductosAgregados === 'list' ? 'active' : ''}`}
                      onClick={() => setVistaProductosAgregados('list')}
                      title="Vista lista"
                    >
                      <i className="fas fa-list"></i>
                    </button>
                  </div>
                  <div className="total-preview">
                    Total: <span className="total-amount">${total.toFixed(2)}</span>
                    <span className="total-amount" style={{ marginLeft: '10px', color: '#10b981' }}>
                      {utilidadTotal === null ? 'Utilidad: pendiente por costo de compra' : `Utilidad: $${utilidadTotal.toFixed(2)}`}
                    </span>
                  </div>
                </div>
                <div className={`productos-grid ${vistaProductosAgregados === 'list' ? 'view-lista' : 'view-grid'}`}>
                  {productos.map((p) => (
                    <div key={p.id} className={`producto-item-expanded ${erroresStock[p.id] ? 'error-stock' : ''}`}>
                      <div className="producto-main-info">
                        <span className="producto-nombre">{p.nombre}</span>
                        <div className="producto-precio-info">
                          <span className="producto-detalle">
                            {p.cantidad} x ${p.precio.toFixed(2)} = <strong>${(p.cantidad * p.precio).toFixed(2)}</strong>
                          </span>
                          <span className="producto-detalle" style={{ color: '#047857' }}>
                            {p.costo_compra_configurado === false || obtenerCostoCompraRegistrado(p) === null
                              ? 'Costo de compra no registrado | Utilidad pendiente'
                              : `Costo: $${(toNumber(p.costo_compra) * p.cantidad).toFixed(2)} | Utilidad: $${(p.utilidad_total || 0).toFixed(2)}`}
                          </span>
                          {p.lote && (
                            <span className="producto-detalle">Lote: {p.lote}</span>
                          )}
                          {p.fecha_vencimiento && (
                            <span className="producto-detalle">Vence: {p.fecha_vencimiento}</span>
                          )}
                          {erroresStock[p.id] && (
                            <span className="error-message"> - {erroresStock[p.id]}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="producto-controls-expanded">
                        <div className="controles-rapidos-supercompactos">
                          <div className="botones-rapidos-linea">
                            <button 
                              className="button micro-button cantidad-rapida-btn"
                              onClick={() => actualizarCantidadRapida(p.id, -1)}
                              title="Reducir 1"
                            >
                              -1
                            </button>
                            <button 
                              className="button micro-button cantidad-rapida-btn"
                              onClick={() => actualizarCantidadRapida(p.id, 1)}
                              title="Agregar 1"
                            >
                              +1
                            </button>
                            <button 
                              className="button micro-button cantidad-rapida-btn suma-docena"
                              onClick={() => sumarDocenas(p.id, 12)}
                              title="Agregar docena (+12)"
                            >
                              +12
                            </button>
                            <button 
                              className="button micro-button cantidad-rapida-btn suma-docena"
                              onClick={() => sumarDocenas(p.id, 24)}
                              title="Agregar 2 docenas (+24)"
                            >
                              +24
                            </button>
                          </div>
                          
                          {editandoProductoId === p.id ? (
                            <div className="editar-cantidad-container">
                              <input
                                type="number"
                                value={cantidadEditada}
                                onChange={(e) => setCantidadEditada(e.target.value)}
                                min="1"
                                className="editar-cantidad-input"
                                autoFocus
                              />
                              <button 
                                className="button micro-button success-button"
                                onClick={() => guardarEdicionCantidad(p.id)}
                              >
                                <i className="fas fa-check"></i>
                              </button>
                              <button 
                                className="button micro-button danger-button"
                                onClick={cancelarEdicion}
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            </div>
                          ) : (
                            <div className="acciones-principales">
                              <button
                                className="button micro-button info-button"
                                onClick={() => iniciarEdicionCantidad(p)}
                                title="Editar cantidad manualmente"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button
                                className="button micro-button danger-button"
                                onClick={() => eliminarProducto(p.id)}
                                title="Eliminar producto"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Botones de acción en la parte inferior */}
          <div className="action-buttons-bottom">
            <button 
              className="button preview-button main-action-button" 
              onClick={mostrarPrevia}
              disabled={productos.length === 0 || !cliente || !vendedorSeleccionado || Object.keys(erroresStock).length > 0}
            >
              <i className="fas fa-eye"></i> Vista Previa y Guardar
            </button>
            
            <div className="secondary-actions-grid">
              <button
                className="button secondary-button"
                onClick={() => navigate('/facturas')}
              >
                <i className="fas fa-file-invoice"></i> Ver Facturas
              </button>
              <button
                className="button info-button"
                onClick={() => navigate('/catalogo')}
              >
                <i className="fas fa-cog"></i> Administrar Catálogo
              </button>
              <button
                className="button success-button"
                onClick={() => navigate('/catalogo-clientes')}
              >
                <i className="fas fa-share"></i> Enviar Catálogo
              </button>
              <button
                className="button warning-button"
                onClick={() => navigate('/gestion-pedidos')}
              >
                <i className="fas fa-clipboard-list"></i> Gestión Pedidos
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default InvoiceScreen;