import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/auth-context';
import { EMPRESA, DESARROLLADOR } from './config/empresa';
import InvoiceScreen from './components/InvoiceScreen';
import FacturasGuardadas from './components/FacturasGuardadas';
import FacturaDetalle from './components/FacturaDetalle';
import ReportesCobros from './components/ReportesCobros';
import CatalogoProductos from './components/CatalogoProductos';
import CatalogoClientes from './components/CatalogoClientes';
import ClientesScreen from './components/ClientesScreen';
import GestionPedidos from './components/GestionPedidos';
import Login from './components/Login';
import RecuperarContrasena from './components/RecuperarContrasena';
import RestablecerContrasena from './components/RestablecerContrasena';
import NotFound from './components/NotFound';
import Navigation from './components/Navigation';
import GestionInventario from './components/GestionInventario';
import DashboardVentas from './components/DashboardVentas';
import RutasCobro from './components/RutasCobro';
import GastosScreen from './components/GastosScreen';
import GastosEmpresa from './components/GastosEmpresa';
import GastosContabilidadFacil from './components/GastosContabilidadFacil';
import CuentasPorPagar from './components/CuentasPorPagar';
import ContabilidadScreen from './components/ContabilidadScreen';
import HistorialMovimientos from './components/HistorialMovimientos';
import AuditoriaProductos from './components/AuditoriaProductos';
import ReporteClientesPorProducto from './components/ReporteClientesPorProducto';
import InformeVentasDiarias from './components/InformeVentasDiarias';
import InformeCobrosDiarios from './components/InformeCobrosDiarios';

// Componente para proteger rutas según el rol
const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Estado de carga
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Redirección si no está autenticado
  if (!user) {
    console.log(`Redirigiendo a login desde: ${location.pathname}`);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Solo superadmin puede pasar por encima de los roles declarados por cada ruta.
  if (requiredRoles.length > 0 && user.role !== 'superadmin' && !requiredRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Renderizar contenido protegido
  return children;
};

const DESCRIPCION_CATALOGO = `Catálogo digital de productos ${EMPRESA.nombreCorto}. Desarrollado por ${DESARROLLADOR.marca} - ${DESARROLLADOR.nombre} ${DESARROLLADOR.telefono}`;

// Componente para manejar los metatags específicos de cada página
const PageMeta = ({ title, description }) => {
  const tituloPagina = title ? `${title} - ${EMPRESA.nombreCorto}` : `Catálogo ${EMPRESA.nombreCorto}`;
  return (
    <Helmet>
      <title>{tituloPagina}</title>
      <meta name="description" content={description || `Sistema de gestión y catálogo de productos ${EMPRESA.nombreCorto}`} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
      <meta name="theme-color" content="#1f56d3" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content={EMPRESA.nombreCorto} />
      
      {/* Open Graph tags para compartir */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={tituloPagina} />
      <meta property="og:description" content={description || 'Sistema de gestión y catálogo de productos'} />
      
      {/* Prevenir indexación en desarrollo */}
      {import.meta.env.DEV && (
        <meta name="robots" content="noindex, nofollow" />
      )}
    </Helmet>
  );
};

// Wrapper components para manejar navegación
const ClientesScreenWrapper = () => {
  const navigate = useNavigate();

  const manejarHacerPedido = (cliente) => {
    const params = new URLSearchParams({
      nombre: cliente?.nombre || '',
      telefono: cliente?.telefono || '',
      direccion: cliente?.direccion || '',
      correo: cliente?.correo || ''
    });

    navigate(`/catalogo-clientes?${params.toString()}`, {
      state: {
        clienteData: {
          nombre: cliente?.nombre || '',
          telefono: cliente?.telefono || '',
          direccion: cliente?.direccion || '',
          correo: cliente?.correo || '',
          clasificacion: cliente?.clasificacion || 3,
          id: cliente?.id || null
        }
      }
    });
  };
  
  return (
    <ClientesScreen 
      onVolver={() => navigate('/facturacion')} // O la ruta que prefieras
      onHacerPedido={manejarHacerPedido}
      onSeleccionarCliente={(cliente) => {
        // Lógica para cuando se selecciona un cliente
        console.log('Cliente seleccionado:', cliente);
        // Puedes navegar a otra pantalla o mantenerte aquí
      }}
    />
  );
};

const CatalogoProductosWrapper = ({ mode }) => {
  const navigate = useNavigate();
  
  return (
    <CatalogoProductos 
      mode={mode}
      onVolver={() => navigate(-1)}
    />
  );
};

function AppContent() {
  const { user } = useAuth();

  return (
    <HelmetProvider>
      <Router>
          {/* Metatags globales */}
          <PageMeta />
          
          {/* Navigation siempre visible */}
          <Navigation />
          
          <Routes>
            {/* Ruta pública principal - Catálogo para todos */}
            <Route path="/" element={
              <>
                <PageMeta 
                  title="Catálogo Digital" 
                  description={DESCRIPCION_CATALOGO}
                />
                <CatalogoClientes />
              </>
            } />
            
            {/* Ruta pública del catálogo */}
            <Route path="/catalogo-clientes" element={
              <>
                <PageMeta 
                  title="Catálogo Digital" 
                  description={DESCRIPCION_CATALOGO}
                />
                <CatalogoClientes />
              </>
            } />
            
            {/* Login para equipo */}
            <Route path="/login" element={
              <>
                <PageMeta title="Iniciar Sesión" description="Inicia sesión en el sistema" />
                {user ? <Navigate to="/facturacion" replace /> : <Login />}
              </>
            } />

            <Route path="/recuperar-contrasena" element={
              <>
                <PageMeta title="Recuperar contraseña" description="Solicita un enlace para recuperar el acceso al sistema" />
                <RecuperarContrasena />
              </>
            } />

            <Route path="/restablecer-contrasena" element={
              <>
                <PageMeta title="Cambiar contraseña" description="Crea una nueva contraseña para tu cuenta" />
                <RestablecerContrasena />
              </>
            } />
            
            {/* RUTA PRINCIPAL DE FACTURACIÓN - InvoiceScreen */}
            <Route path="/facturacion" element={
              <ProtectedRoute requiredRoles={['superadmin', 'admin', 'vendedor', 'inventario']}>
                <>
                  <PageMeta title="Facturación" description="Sistema de facturación" />
                  <InvoiceScreen />
                </>
              </ProtectedRoute>
            } />

            {/* Ruta para Nueva Factura - También lleva a InvoiceScreen */}
            <Route path="/nueva-factura" element={
              <ProtectedRoute requiredRoles={['superadmin', 'admin', 'vendedor', 'inventario']}>
                <>
                  <PageMeta title="Nueva Factura" description="Crear nueva factura" />
                  <InvoiceScreen />
                </>
              </ProtectedRoute>
            } />
            
            {/* Ruta principal después del login según rol */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <>
                  <PageMeta title="Dashboard" description="Panel de control" />
                  {user?.role === 'cliente' ? 
                    <CatalogoProductosWrapper mode="cliente" /> : 
                    <DashboardVentas />
                  }
                </>
              </ProtectedRoute>
            } />
            
            {/* Rutas para administrador, contabilidad, inventario y vendedor */}
            <Route path="/facturas" element={
              <ProtectedRoute requiredRoles={['superadmin', 'admin', 'contabilidad', 'inventario', 'vendedor']}>
                <>
                  <PageMeta title="Facturas Guardadas" description="Gestión de facturas" />
                  <FacturasGuardadas />
                </>
              </ProtectedRoute>
            } />
            
            {/* NUEVA RUTA: Rutas de Cobro Inteligentes */}
            <Route path="/rutas-cobro" element={
              <ProtectedRoute requiredRoles={['superadmin', 'admin', 'contabilidad', 'vendedor']}>
                <>
                  <PageMeta 
                    title="Rutas de Cobro Inteligentes" 
                    description="Sistema de priorización para visitas de cobranza optimizadas" 
                  />
                  <RutasCobro />
                </>
              </ProtectedRoute>
            } />
            
            {/* Nueva ruta para Dashboard de Ventas */}
            <Route path="/dashboard-ventas" element={
              <ProtectedRoute requiredRoles={['superadmin', 'admin', 'contabilidad']}>
                <>
                  <PageMeta title="Dashboard de Ventas" description="Panel de control y análisis de ventas" />
                  <DashboardVentas />
                </>
              </ProtectedRoute>
            } />
            
            <Route path="/factura/:id" element={
              <ProtectedRoute requiredRoles={['superadmin', 'admin', 'inventario', 'contabilidad', 'vendedor']}>
                <>
                  <PageMeta title="Detalle de Factura" description="Detalle completo de la factura" />
                  <FacturaDetalle />
                </>
              </ProtectedRoute>
            } />
            
            <Route path="/reportes-cobros" element={
              <ProtectedRoute requiredRoles={['superadmin', 'admin', 'contabilidad', 'vendedor']}>
                <>
                  <PageMeta title="Reportes de Cobros" description="Reportes y análisis de cobros" />
                  <ReportesCobros />
                </>
              </ProtectedRoute>
            } />

            <Route path="/informe-ventas-diarias" element={
              <ProtectedRoute requiredRoles={['superadmin', 'admin', 'contabilidad', 'vendedor']}>
                <>
                  <PageMeta title="Informe de Ventas Diarias" description="Resumen diario, mensual y por vendedor de ventas" />
                  <InformeVentasDiarias />
                </>
              </ProtectedRoute>
            } />

            <Route path="/informe-cobros-diarios" element={
              <ProtectedRoute requiredRoles={['superadmin', 'admin', 'contabilidad', 'vendedor']}>
                <>
                  <PageMeta title="Informe de Cobros Diarios" description="Resumen diario, mensual y por vendedor de cobros" />
                  <InformeCobrosDiarios />
                </>
              </ProtectedRoute>
            } />

            {/* Ruta para Reporte de Clientes por Producto */}
            <Route path="/reporte-clientes-producto" element={
              <ProtectedRoute requiredRoles={['superadmin']}>
                <>
                  <PageMeta title="Clientes por Producto" description="Reporte de clientes que compraron cada producto" />
                  <ReporteClientesPorProducto />
                </>
              </ProtectedRoute>
            } />

            {/* Ruta para Gestión de Gastos */}
            <Route path="/gastos" element={
              <ProtectedRoute requiredRoles={['superadmin', 'admin', 'contabilidad', 'vendedor']}>
                <>
                  <PageMeta title="Gestión de Gastos" description="Control y análisis de gastos" />
                  <GastosScreen />
                </>
              </ProtectedRoute>
            } />

            {/* Ruta para Cuentas por Pagar */}
            <Route path="/cuentas-por-pagar" element={
              <ProtectedRoute requiredRoles={['superadmin', 'admin', 'contabilidad']}>
                <>
                  <PageMeta title="Cuentas por Pagar" description="Gestión de pagos a proveedores" />
                  <CuentasPorPagar />
                </>
              </ProtectedRoute>
            } />

            {/* Ruta para Gastos de la Empresa */}
            <Route path="/gastos-empresa" element={
              <ProtectedRoute requiredRoles={['superadmin', 'admin', 'contabilidad']}>
                <>
                  <PageMeta title="Gastos de la Empresa" description="Control de gastos operacionales" />
                  <GastosEmpresa />
                </>
              </ProtectedRoute>
            } />

            {/* Ruta simple para registrar gastos contables */}
            <Route path="/contabilidad-gastos" element={
              <ProtectedRoute requiredRoles={['superadmin', 'admin', 'contabilidad']}>
                <>
                  <PageMeta title="Gastos Facil" description="Registro rapido de gastos para contabilidad" />
                  <GastosContabilidadFacil />
                </>
              </ProtectedRoute>
            } />

            {/* Ruta para Dashboard de Contabilidad */}
            <Route path="/dashboard-contabilidad" element={
              <ProtectedRoute requiredRoles={['superadmin', 'admin', 'contabilidad', 'vendedor']}>
                <>
                  <PageMeta title="Dashboard de Contabilidad" description="Panel de control contable" />
                  <ContabilidadScreen />
                </>
              </ProtectedRoute>
            } />
            
            <Route path="/catalogo" element={
              <ProtectedRoute requiredRoles={['superadmin', 'admin', 'inventario', 'contabilidad', 'vendedor']}>
                <>
                  <PageMeta title="Catálogo de Productos" description="Gestión del catálogo de productos" />
                  {/* Modo de catálogo según rol: contabilidad en solo lectura */}
                  {user?.role === 'contabilidad' 
                    ? <CatalogoProductosWrapper mode="contabilidad" /> 
                    : <CatalogoProductosWrapper mode="admin" />}
                </>
              </ProtectedRoute>
            } />
            
            {/* Rutas para gestión de inventario */}
            <Route path="/movimientos" element={
              <ProtectedRoute requiredRoles={['superadmin', 'admin', 'inventario']}>
                <>
                  <PageMeta title="Historial de Movimientos" description="Auditoría de cambios de inventario" />
                  <HistorialMovimientos />
                </>
              </ProtectedRoute>
            } />

            <Route path="/auditoria-productos" element={
              <ProtectedRoute requiredRoles={['superadmin', 'admin', 'inventario']}>
                <>
                  <PageMeta title="Auditoría de Productos" description="Seguimiento de cambios en catálogo" />
                  <AuditoriaProductos />
                </>
              </ProtectedRoute>
            } />

            <Route path="/gestion-inventario" element={
              <ProtectedRoute requiredRoles={['superadmin', 'admin', 'inventario']}>
                <>
                  <PageMeta title="Gestión de Inventario" description="Control y gestión del inventario" />
                  <GestionInventario />
                </>
              </ProtectedRoute>
            } />
            
            {/* Rutas para gestión de pedidos */}
            <Route path="/gestion-pedidos" element={
              <ProtectedRoute requiredRoles={['superadmin', 'admin', 'vendedor', 'inventario', 'contabilidad']}>
                <>
                  <PageMeta title="Gestión de Pedidos" description="Seguimiento y gestión de pedidos" />
                  <GestionPedidos mode="vendedor" />
                </>
              </ProtectedRoute>
            } />
            
                        {/* Rutas para vendedor - CLIENTES CORREGIDO */}
            <Route path="/clientes" element={
              <ProtectedRoute requiredRoles={['superadmin', 'admin', 'vendedor', 'inventario', 'contabilidad']}>
                <>
                  <PageMeta title="Gestión de Clientes" description="Administración de clientes del sistema" />
                  <ClientesScreenWrapper />
                </>
              </ProtectedRoute>
            } />
            
            {/* Ruta para cliente */}
            <Route path="/catalogo-cliente" element={
              <ProtectedRoute requiredRoles={['cliente']}>
                <>
                  <PageMeta title="Catálogo" description="Catálogo exclusivo para clientes" />
                  <CatalogoProductosWrapper mode="cliente" />
                </>
              </ProtectedRoute>
            } />
            
            {/* Rutas adicionales */}
            <Route path="/unauthorized" element={
              <>
                <PageMeta title="Acceso No Autorizado" description="No tienes permisos para acceder a esta página" />
                <div className="flex justify-center items-center h-screen">
                  <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600">Acceso no autorizado</h1>
                    <p className="text-gray-600">No tienes permisos para acceder a esta página</p>
                  </div>
                </div>
              </>
            } />
            
            <Route path="*" element={
              <>
                <PageMeta title="Página No Encontrada" description="La página que buscas no existe" />
                <NotFound />
              </>
            } />
          </Routes>
      </Router>
    </HelmetProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;