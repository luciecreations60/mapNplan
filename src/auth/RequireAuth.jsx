import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import { RouteLoading } from '../components/feedback/RouteLoading.jsx';

export function RequireAuth({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <RouteLoading />;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;

  return children;
}
