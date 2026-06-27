import { useAuth } from '@/context/AuthContext';
import SupervisorDashboard from '@/components/dashboard/SupervisorDashboard';
import BuilderDashboard from '@/components/dashboard/BuilderDashboard';
import ProjectManagerDashboard from '@/components/dashboard/ProjectManagerDashboard';
import AccountantDashboard from '@/components/dashboard/AccountantDashboard';
import AdminDashboard from '@/components/dashboard/AdminDashboard';

export default function DashboardPage() {
  const { user } = useAuth();

  switch (user?.role) {
    case 'BUILDER':
      return <BuilderDashboard />;
    case 'PROJECT_MANAGER':
      return <ProjectManagerDashboard />;
    case 'SITE_SUPERVISOR':
      return <SupervisorDashboard />;
    case 'ACCOUNTANT':
      return <AccountantDashboard />;
    case 'ADMIN':
      return <AdminDashboard />;
    default:
      return <SupervisorDashboard />;
  }
}
