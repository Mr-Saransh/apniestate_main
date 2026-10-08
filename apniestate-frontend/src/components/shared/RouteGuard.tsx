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

  // Strict role enforcement for SUB_CONTRACTOR: cannot access ERP/CRM modules
  if (user?.role === 'SUB_CONTRACTOR') {
    const allowed = ['/subcontractor', '/profile', '/notifications'];
    const isAllowed = allowed.some((prefix) => location.pathname.startsWith(prefix));
    if (!isAllowed) {
      return <AccessDeniedPage />;
    }
  }

  return <Outlet />;
}
