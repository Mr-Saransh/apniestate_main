import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { isRouteVisible } from '@/config/navigation.config';
import AccessDeniedPage from '@/pages/AccessDeniedPage';

interface RouteGuardProps {
  permission?: string;
}

export default function RouteGuard({ permission }: RouteGuardProps) {
  const { hasPermission, isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading || !isAuthenticated) {
    return (
      <div className="loading-page" style={{ minHeight: '100vh' }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  // if (permission && !hasPermission(permission)) {
  //   return <AccessDeniedPage />;
  // }

  // Also verify against the strict UI configuration to ensure module visibility matches
  // if (user && !isRouteVisible(location.pathname, user.role)) {
  //   return <AccessDeniedPage />;
  // }

  return <Outlet />;
}
