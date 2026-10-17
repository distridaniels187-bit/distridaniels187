import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/auth-context';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Estado de carga
  if (isLoading) {
    return <div className="loading-auth">Cargando...</div>;
  }

  // Redirección si no está autenticado
  if (!isAuthenticated) {
    console.log(`Redirigiendo a login desde: ${location.pathname}`);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Renderizar contenido protegido
  return children;
};

export default ProtectedRoute;