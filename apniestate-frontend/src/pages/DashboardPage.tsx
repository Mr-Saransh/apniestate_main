import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import ProjectCommandCenter from '@/pages/ProjectCommandCenter';

export default function DashboardPage() {
  const { user } = useAuth();
  if (user?.role === 'SUB_CONTRACTOR') {
    return <Navigate to="/subcontractor/dashboard" replace />;
  }
  return <ProjectCommandCenter />;
}

