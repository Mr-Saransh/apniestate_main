import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface RouteGuardProps {
  permission: string;
}

export default function RouteGuard({ permission }: RouteGuardProps) {
  const { hasPermission, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="loading-page" style={{ minHeight: '100vh' }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (!hasPermission(permission)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
