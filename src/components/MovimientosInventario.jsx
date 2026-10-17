import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/auth-context';
import './MovimientosInventario.css';

export default function MovimientosInventario() {
  const { user } = useAuth();
  
  const [movimiento, setMovimiento] = useState({
    producto_id: '',
    tipo_movimiento: 'entrada',
    cantidad: '',
    precio_unitario: '',
    motivo: '',
    observaciones: ''
  });

  const [productos, setProductos] = useState([]);
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const submittingRef = useRef(false);

  useEffect(() => {
    cargarProductos();
  }, []);

  // Filtrar productos cuando cambia la búsqueda
  useEffect(() => {
    if (busqueda.trim() === '') {
      setProductosFiltrados(productos);
    } else {
      const filtrados = productos.filter(producto =>
        producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        producto.id.toString().includes(busqueda)
      );
      setProductosFiltrados(filtrados);
    }
  }, [busqueda, productos]);

  const cargarProductos = async () => {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('id, nombre, precio, stock')
        .order('nombre');

      if (error) {
        setError('Error al cargar productos: ' + error.message);
      } else {
        setProductos(data);
        setProductosFiltrados(data);
        setError('');
      }
    } catch (err) {
      setError('Error inesperado: ' + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setLoading(true);
    setError('');

    const cantidadMovida = Number.parseInt(movimiento.cantidad, 10);
    if (!movimiento.producto_id) {
      setError('Debe seleccionar un producto');
      setLoading(false);
      submittingRef.current = false;
      return;
    }

    if (!Number.isInteger(cantidadMovida) || cantidadMovida <= 0) {
      setError('La cantidad debe ser un número entero mayor a cero');
      setLoading(false);
      submittingRef.current = false;
      return;
    }

    if (!movimiento.motivo) {
      setError('Debe seleccionar un motivo');
      setLoading(false);
      submittingRef.current = false;
      return;
    }

    try {
      const { data: producto, error: productoError } = await supabase
        .from('productos')
        .select('id, stock, activo')
        .eq('id', movimiento.producto_id)
        .single();

      if (productoError) throw productoError;
      if (!producto) throw new Error('No se encontró el producto seleccionado');

      const stockAnterior = Number(producto.stock) || 0;
      if (movimiento.tipo_movimiento === 'salida' && cantidadMovida > stockAnterior) {
        setError(`No hay suficiente stock disponible. Stock actual: ${stockAnterior}`);
        setLoading(false);
        submittingRef.current = false;
        return;
      }
      
      // Determinar qué usar como nombre de usuario
      let nombreUsuario = 'Sistema';
      if (user) {
        if (user.username) {
          nombreUsuario = user.username;
        } else if (user.email) {
          nombreUsuario = user.email;
        } else if (user.id) {
          nombreUsuario = user.id;
        } else if (user.name) {
          nombreUsuario = user.name;
        }
      }
      
      // Calcular nuevo stock según tipo de movimiento
      let stockNuevo = stockAnterior;
      if (movimiento.tipo_movimiento === 'entrada') {
        stockNuevo = stockAnterior + cantidadMovida;
      } else if (movimiento.tipo_movimiento === 'salida') {
        stockNuevo = stockAnterior - cantidadMovida;
      }

      const { error: movimientoError } = await supabase
        .from('movimientos_inventario')
        .insert([{
          producto_id: producto.id,
          tipo_movimiento: movimiento.tipo_movimiento,
          cantidad: cantidadMovida,
          stock_anterior: stockAnterior,
          stock_nuevo: stockNuevo,
          descripcion: `${movimiento.motivo}${movimiento.observaciones ? ' - ' + movimiento.observaciones : ''}`,
          usuario: nombreUsuario,
          rol_usuario: user?.role || 'N/A',
          precio_unitario: movimiento.precio_unitario ? parseFloat(movimiento.precio_unitario) : null,
          motivo: movimiento.motivo,
          observaciones: movimiento.observaciones
        }]);

      if (movimientoError) throw movimientoError;

      setMovimiento({
        producto_id: '',
        tipo_movimiento: 'entrada',
        cantidad: '',
        precio_unitario: '',
        motivo: '',
        observaciones: ''
      });
      setBusqueda('');

      const { data: productoActualizado, error: recargaError } = await supabase
        .from('productos')
        .select('stock')
        .eq('id', producto.id)
        .single();

      if (recargaError) {
        throw new Error(`El movimiento se guardó, pero no se pudo verificar el stock: ${recargaError.message}`);
      }

      if (Number(productoActualizado.stock) !== stockNuevo) {
        console.error('El movimiento se guardó, pero el stock final no coincide con el esperado', {
          productoId: producto.id,
          esperado: stockNuevo,
          actual: productoActualizado.stock
        });
        setError(
          `El movimiento se registró, pero el stock quedó en ${productoActualizado.stock} ` +
          `y se esperaba ${stockNuevo}. No repitas el movimiento; solicita revisar la configuración del inventario.`
        );
      } else {
        if (stockNuevo === 0 && producto.activo) {
          const { error: desactivarError } = await supabase
            .from('productos')
            .update({ activo: false })
            .eq('id', producto.id);

          if (desactivarError) {
            console.error('Stock actualizado, pero no se pudo desactivar el producto:', desactivarError);
            setError(`El stock se actualizó a 0, pero no se pudo desactivar el producto: ${desactivarError.message}`);
          } else {
            alert(`✅ Movimiento registrado. Stock actualizado una sola vez: ${stockAnterior} → ${productoActualizado.stock}`);
          }
        } else {
          alert(`✅ Movimiento registrado. Stock actualizado una sola vez: ${stockAnterior} → ${productoActualizado.stock}`);
        }
      }

      await cargarProductos();
    } catch (err) {
      console.error('Error inesperado:', err);
      setError('Error inesperado: ' + err.message);
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

  const limpiarBusqueda = () => {
    setBusqueda('');
  };

  // Opciones para los menús desplegables de motivos
  const motivosEntrada = [
    { value: 'compra', label: 'Compra' },
    { value: 'devolucion', label: 'Devolución' },
    { value: 'ajuste', label: 'Ajuste de inventario' }
  ];

  const motivosSalida = [
    { value: 'venta', label: 'Venta' },
    { value: 'devolucion', label: 'Devolución' },
    { value: 'ajuste', label: 'Ajuste de inventario' },
    { value: 'merma', label: 'Merma/pérdida' },
    { value: 'transferencia', label: 'Transferencia' }
  ];

  return (
    <div className="movimientos-container">
      {/* Header */}
      <div className="movimientos-header">
        <h1 className="movimientos-title">CONTROL DE INVENTARIO</h1>
        <p className="movimientos-subtitle">Registro de movimientos de productos</p>
      </div>

      {/* Mostrar error si existe */}
      {error && (
        <div className="error-message">
          <span>❌ {error}</span>
          <button onClick={() => setError('')} className="close-error">X</button>
        </div>
      )}

      {/* Formulario */}
      <div className="movimientos-content">
        <form onSubmit={handleSubmit} className="movimientos-form">
          
          {/* Buscador de Productos */}
          <div className="form-group">
            <label className="form-label">
              🔍 Buscar Producto
            </label>
            <div className="search-container">
              <input
                type="text"
                placeholder="Escribe el nombre o ID del producto..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="search-input"
              />
              {busqueda && (
                <button 
                  type="button" 
                  onClick={limpiarBusqueda}
                  className="clear-search"
                  title="Limpiar búsqueda"
                >
                  ✕
                </button>
              )}
            </div>
            {busqueda && (
              <div className="search-info">
                <span>
                  {productosFiltrados.length} producto(s) encontrado(s)
                  {productosFiltrados.length === 0 && ' - No se encontraron resultados'}
                </span>
              </div>
            )}
          </div>

          {/* Producto */}
          <div className="form-group">
            <label className="form-label">
              Producto *
            </label>
            <select
              value={movimiento.producto_id}
              onChange={(e) => setMovimiento({...movimiento, producto_id: e.target.value})}
              required
              className="form-select"
            >
              <option value="">Seleccionar Producto</option>
              {productosFiltrados.map((producto) => (
                <option key={producto.id} value={producto.id}>
                  {producto.nombre} - Stock: {producto.stock} - ID: {producto.id}
                </option>
              ))}
            </select>
            {productosFiltrados.length === 0 && busqueda && (
              <div className="no-results">
                No se encontraron productos que coincidan con "{busqueda}"
              </div>
            )}
          </div>

          {/* Tipo de Movimiento y Cantidad en misma línea */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Tipo de Movimiento *
              </label>
              <select
                value={movimiento.tipo_movimiento}
                onChange={(e) => setMovimiento({...movimiento, tipo_movimiento: e.target.value, motivo: ''})}
                required
                className="form-select"
              >
                <option value="entrada">📥 Entrada (Aumenta stock)</option>
                <option value="salida">📤 Salida (Disminuye stock)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Cantidad *
              </label>
              <input
                type="number"
                min="1"
                placeholder="Ej: 10"
                value={movimiento.cantidad}
                onChange={(e) => setMovimiento({...movimiento, cantidad: e.target.value})}
                required
                className="form-input"
              />
            </div>
          </div>

          {/* Precio Unitario y Motivo en misma línea */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Precio Unitario (Opcional)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Ej: 5800"
                value={movimiento.precio_unitario}
                onChange={(e) => setMovimiento({...movimiento, precio_unitario: e.target.value})}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Motivo *
              </label>
              <select
                value={movimiento.motivo}
                onChange={(e) => setMovimiento({...movimiento, motivo: e.target.value})}
                required
                className="form-select"
              >
                <option value="">Seleccionar motivo</option>
                {movimiento.tipo_movimiento === 'entrada'
                  ? motivosEntrada.map((motivo) => (
                      <option key={motivo.value} value={motivo.value}>
                        {motivo.label}
                      </option>
                    ))
                  : motivosSalida.map((motivo) => (
                      <option key={motivo.value} value={motivo.value}>
                        {motivo.label}
                      </option>
                    ))
                }
              </select>
            </div>
          </div>

          {/* Observaciones */}
          <div className="form-group">
            <label className="form-label">
              Observaciones (Opcional)
            </label>
            <textarea
              placeholder="Detalles adicionales del movimiento..."
              value={movimiento.observaciones}
              onChange={(e) => setMovimiento({...movimiento, observaciones: e.target.value})}
              rows="3"
              className="form-textarea"
            />
          </div>

          {/* Botón */}
          <div className="form-actions">
            <button 
              type="submit" 
              disabled={loading}
              className="submit-button"
            >
              {loading ? 'Procesando...' : 'Registrar Movimiento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}