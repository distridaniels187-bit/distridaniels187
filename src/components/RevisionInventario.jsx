import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/auth-context';
import './RevisionInventario.css';

const FILTROS_REVISION = [
  { id: 'todos', label: 'Todos' },
  { id: 'pendiente', label: 'Pendientes' },
  { id: 'verificado', label: 'Verificados' },
  { id: 'diferencia', label: 'Diferencias' },
  { id: 'ajustado', label: 'Ajustados' }
];

function formatNumber(value) {
  return new Intl.NumberFormat('es-CO').format(Number(value) || 0);
}

export default function RevisionInventario() {
  const { user } = useAuth();
  const [productos, setProductos] = useState([]);
  const [revisiones, setRevisiones] = useState({});
  const [cantidades, setCantidades] = useState({});
  const [observaciones, setObservaciones] = useState({});
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [cargando, setCargando] = useState(true);
  const [guardandoId, setGuardandoId] = useState(null);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const cargarInventario = useCallback(async () => {
    setCargando(true);
    setError('');

    try {
      const { data: productosData, error: productosError } = await supabase
        .from('productos')
        .select('id, nombre, codigo, categoria, stock')
        .order('nombre', { ascending: true });
      if (productosError) throw productosError;

      const { data: historialData, error: historialError } = await supabase
        .rpc('obtener_ultimas_revisiones_inventario');
      if (historialError) throw historialError;

      const revisionesRecientes = {};
      for (const revision of historialData || []) {
        if (revision.producto_id && !revisionesRecientes[revision.producto_id]) {
          revisionesRecientes[revision.producto_id] = revision;
        }
      }

      setProductos(productosData || []);
      setRevisiones(revisionesRecientes);
      setCantidades({});
      setObservaciones({});
    } catch (loadError) {
      console.error('Error cargando la revisión de inventario:', loadError);
      setError(`No se pudo cargar la revisión de inventario: ${loadError.message || loadError}`);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarInventario();
  }, [cargarInventario]);

  const estadoProducto = useCallback((producto) => {
    const revision = revisiones[producto.id];
    const ingresado = cantidades[producto.id];
    if (ingresado !== undefined && String(ingresado).trim() !== '') {
      const cantidadReal = Number(ingresado);
      if (Number.isInteger(cantidadReal) && cantidadReal !== (Number(producto.stock) || 0)) {
        return 'diferencia';
      }
      if (Number.isInteger(cantidadReal)) return 'verificado';
    }
    return revision?.estado_revision || 'pendiente';
  }, [cantidades, revisiones]);

  const productosFiltrados = useMemo(() => {
    const busquedaNormalizada = busqueda.trim().toLocaleLowerCase();
    return productos.filter((producto) => {
      const coincideBusqueda = !busquedaNormalizada ||
        String(producto.nombre || '').toLocaleLowerCase().includes(busquedaNormalizada) ||
        String(producto.codigo || '').toLocaleLowerCase().includes(busquedaNormalizada) ||
        String(producto.id).includes(busquedaNormalizada);
      return coincideBusqueda &&
        (filtroEstado === 'todos' || estadoProducto(producto) === filtroEstado);
    });
  }, [busqueda, filtroEstado, productos, estadoProducto]);

  const resumen = useMemo(() => {
    const estadoCounts = Object.fromEntries(FILTROS_REVISION.map(({ id }) => [id, 0]));
    let unidadesSistema = 0;
    let diferenciaNeta = 0;
    let unidadesPendientes = 0;
    let unidadesVerificadas = 0;
    let unidadesAjustadas = 0;

    for (const producto of productos) {
      const stock = Number(producto.stock) || 0;
      const revision = revisiones[producto.id];
      const estado = estadoProducto(producto);
      estadoCounts[estado] = (estadoCounts[estado] || 0) + 1;
      unidadesSistema += stock;
      if (estado === 'pendiente') unidadesPendientes += stock;
      if (estado === 'verificado') {
        unidadesVerificadas += cantidades[producto.id] !== undefined
          ? Number(cantidades[producto.id]) || 0
          : Number(revision?.cantidad_real ?? stock) || 0;
      }
      if (revision?.estado_revision === 'ajustado') {
        diferenciaNeta += Number(revision.diferencia) || 0;
        unidadesAjustadas += Number(revision.cantidad_real) || 0;
      }
    }

    return {
      estadoCounts,
      unidadesSistema,
      diferenciaNeta,
      unidadesPendientes,
      unidadesVerificadas,
      unidadesAjustadas
    };
  }, [productos, revisiones, cantidades, estadoProducto]);

  const guardarRevision = async (producto) => {
    const valorIngresado = cantidades[producto.id];
    if (valorIngresado === undefined || String(valorIngresado).trim() === '') {
      setError(`Ingresa la cantidad contada para ${producto.nombre}.`);
      setMensaje('');
      return;
    }

    const cantidadReal = Number(valorIngresado);
    if (!Number.isInteger(cantidadReal) || cantidadReal < 0) {
      setError('La cantidad contada debe ser un número entero igual o mayor que cero.');
      setMensaje('');
      return;
    }

    setGuardandoId(producto.id);
    setError('');
    setMensaje('');
    const nombreUsuario = user?.username || user?.name || user?.email || user?.id || 'Sistema';

    try {
      const { error: guardarError } = await supabase.rpc('guardar_revision_inventario', {
        p_producto_id: producto.id,
        p_stock_sistema: Number(producto.stock) || 0,
        p_stock_real: cantidadReal,
        p_revisado_por: String(nombreUsuario),
        p_rol_usuario: user?.role || 'N/A',
        p_observacion: observaciones[producto.id] || ''
      });
      if (guardarError) throw guardarError;

      setMensaje(
        cantidadReal === Number(producto.stock)
          ? `Conteo de ${producto.nombre} guardado y verificado.`
          : `Conteo de ${producto.nombre} guardado; el stock fue ajustado de ${formatNumber(producto.stock)} a ${formatNumber(cantidadReal)}.`
      );
      await cargarInventario();
    } catch (saveError) {
      console.error('Error guardando la revisión de inventario:', saveError);
      setError(
        `No se guardó la revisión de ${producto.nombre}: ${saveError.message || saveError}. ` +
        'Si el stock cambió mientras contabas, actualiza la lista y vuelve a verificarlo.'
      );
    } finally {
      setGuardandoId(null);
    }
  };

  if (cargando) {
    return <div className="revision-inventario"><p>Cargando inventario para revisión…</p></div>;
  }

  return (
    <section className="revision-inventario" aria-labelledby="revision-titulo">
      <header className="revision-header">
        <div className="revision-heading">
          <span className="revision-eyebrow">Control operativo</span>
          <h1 id="revision-titulo">Revisión física del inventario</h1>
          <p>Compara el conteo físico con el stock registrado. Al guardar una diferencia, el stock se ajusta y queda un registro histórico.</p>
        </div>
        <div className="revision-head-stats" aria-label="Estados de revisión">
          {[
            ['pendiente', 'Pendientes', '#f59e0b'],
            ['verificado', 'Verificados', '#22c55e'],
            ['diferencia', 'Diferencias', '#ef4444'],
            ['ajustado', 'Ajustados', '#3b82f6']
          ].map(([estado, etiqueta, color]) => (
            <article className="revision-head-stat" key={estado} style={{ '--revision-stat-color': color }}>
              <strong>{formatNumber(resumen.estadoCounts[estado] || 0)}</strong>
              <span>{etiqueta}</span>
            </article>
          ))}
        </div>
      </header>

      {error && <div className="revision-alert revision-alert-error" role="alert">{error}</div>}
      {mensaje && <div className="revision-alert revision-alert-success" role="status">{mensaje}</div>}

      <div className="revision-filters">
        <label className="revision-search">
          <input
            type="search"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            placeholder="Buscar producto o código..."
            aria-label="Buscar producto o código"
          />
        </label>
        <div className="revision-filter-pills" role="group" aria-label="Filtrar por estado">
          {FILTROS_REVISION.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              className={`revision-filter-pill ${filtroEstado === id ? 'active' : ''}`}
              aria-pressed={filtroEstado === id}
              onClick={() => setFiltroEstado(id)}
            >
              {label}
              {id !== 'todos' && <span>{formatNumber(resumen.estadoCounts[id] || 0)}</span>}
            </button>
          ))}
          <button type="button" className="revision-refresh" onClick={cargarInventario}>
            Actualizar
          </button>
        </div>
      </div>

      <div className="revision-summary" aria-label="Resumen de revisiones">
        <article className="revision-summary-total">
          <span>Total inventario</span>
          <strong>{formatNumber(resumen.unidadesSistema)} unidades</strong>
          <small>{formatNumber(productos.length)} productos</small>
        </article>
        <article>
          <span>Ajuste neto registrado</span>
          <strong>{resumen.diferenciaNeta > 0 ? '+' : ''}{formatNumber(resumen.diferenciaNeta)} unidades</strong>
          <small>Variación acumulada en las últimas revisiones</small>
        </article>
        <article>
          <span>Pendientes</span>
          <strong>{formatNumber(resumen.estadoCounts.pendiente || 0)}</strong>
          <small>{formatNumber(resumen.unidadesPendientes)} unidades en sistema</small>
        </article>
        <article>
          <span>Verificados</span>
          <strong>{formatNumber(resumen.estadoCounts.verificado || 0)}</strong>
          <small>{formatNumber(resumen.unidadesVerificadas)} unidades contadas</small>
        </article>
        <article>
          <span>Diferencias por confirmar</span>
          <strong>{formatNumber(resumen.estadoCounts.diferencia || 0)}</strong>
          <small>Conteos distintos al stock registrado</small>
        </article>
        <article>
          <span>Ajustados</span>
          <strong>{formatNumber(resumen.estadoCounts.ajustado || 0)}</strong>
          <small>{formatNumber(resumen.unidadesAjustadas)} unidades contadas</small>
        </article>
      </div>

      <div className="revision-table-wrap">
        <table className="revision-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Sistema</th>
              <th>Real</th>
              <th>Diferencia</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Revisado por</th>
              <th>Observación</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {productosFiltrados.map((producto) => {
              const revision = revisiones[producto.id];
              const ingresado = cantidades[producto.id] ?? '';
              const cantidadReal = ingresado === '' ? null : Number(ingresado);
              const diferencia = Number.isInteger(cantidadReal)
                ? cantidadReal - (Number(producto.stock) || 0)
                : revision?.diferencia ?? null;
              const estado = estadoProducto(producto);

              return (
                <tr key={producto.id}>
                  <td>
                    <strong>{producto.nombre}</strong>
                    <small>{producto.codigo || `ID ${producto.id}`}</small>
                  </td>
                  <td>{producto.categoria || '—'}</td>
                  <td>{formatNumber(producto.stock)}</td>
                  <td>
                    <input
                      className="revision-count-input"
                      aria-label={`Conteo físico para ${producto.nombre}`}
                      type="number"
                      min="0"
                      step="1"
                      value={ingresado}
                      onChange={(event) => setCantidades((actual) => ({
                        ...actual,
                        [producto.id]: event.target.value
                      }))}
                      placeholder={revision ? formatNumber(revision.cantidad_real) : 'Contar'}
                    />
                  </td>
                  <td className={diferencia === null ? '' : diferencia === 0 ? 'revision-difference-zero' : 'revision-difference'}>
                    {diferencia === null ? '—' : `${diferencia > 0 ? '+' : ''}${formatNumber(diferencia)}`}
                  </td>
                  <td>
                    <span className={`revision-status revision-status-${estado}`}>{estado}</span>
                  </td>
                  <td>{revision?.fecha_revision ? new Date(revision.fecha_revision).toLocaleDateString('es-CO') : '—'}</td>
                  <td>{revision?.revisado_por || '—'}</td>
                  <td>
                    <input
                      className="revision-note-input"
                      aria-label={`Observación para ${producto.nombre}`}
                      type="text"
                      value={observaciones[producto.id] ?? ''}
                      onChange={(event) => setObservaciones((actual) => ({
                        ...actual,
                        [producto.id]: event.target.value
                      }))}
                      placeholder={revision?.observacion || 'Opcional'}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="revision-save"
                      disabled={guardandoId !== null}
                      onClick={() => guardarRevision(producto)}
                    >
                      {guardandoId === producto.id
                        ? 'Guardando…'
                        : estado === 'diferencia'
                          ? 'Confirmar ajuste'
                          : 'Guardar conteo'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {productosFiltrados.length === 0 && (
          <p className="revision-empty">No hay productos que coincidan con los filtros.</p>
        )}
      </div>
    </section>
  );
}
