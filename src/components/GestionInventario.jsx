import { useState } from 'react';
import MovimientosInventario from './MovimientosInventario';
import HistorialInventario from './HistorialInventario';
import RevisionInventario from './RevisionInventario';
import MejoresProductos from './MejoresProductos';
import './DashboardProducts.css';
export default function GestionInventario() {
  const [vistaActual, setVistaActual] = useState('movimientos');

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="inventario-tabs-shell">
        <div className="inventario-tabs-wrap">
          <div className="inventario-tabs" role="tablist" aria-label="Secciones de inventario">
            <button
              onClick={() => setVistaActual('movimientos')}
              className={`inventario-tab ${vistaActual === 'movimientos' ? 'active' : ''}`}
              role="tab"
              aria-selected={vistaActual === 'movimientos'}
            >
              📥 Registrar Movimiento
            </button>
            <button
              onClick={() => setVistaActual('historial')}
              className={`inventario-tab ${vistaActual === 'historial' ? 'active' : ''}`}
              role="tab"
              aria-selected={vistaActual === 'historial'}
            >
              📊 Ver Historial
            </button>
            <button
              onClick={() => setVistaActual('mejores')}
              className={`inventario-tab ${vistaActual === 'mejores' ? 'active' : ''}`}
              role="tab"
              aria-selected={vistaActual === 'mejores'}
            >
              🏆 Mejores Productos
            </button>
            <button
              onClick={() => setVistaActual('revision')}
              className={`inventario-tab ${vistaActual === 'revision' ? 'active' : ''}`}
              role="tab"
              aria-selected={vistaActual === 'revision'}
            >
              ✅ Revisión física
            </button>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="inventario-content">
        <div className="inventario-content-inner">
          {vistaActual === 'movimientos' && <MovimientosInventario />}
          {vistaActual === 'historial' && <HistorialInventario />}
          {vistaActual === 'mejores' && <MejoresProductos />}
          {vistaActual === 'revision' && <RevisionInventario />}
        </div>
      </div>
    </div>
  );
}