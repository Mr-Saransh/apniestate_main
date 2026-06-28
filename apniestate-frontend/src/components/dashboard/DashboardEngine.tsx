import React from 'react';
import { useAuth } from '@/context/AuthContext';
import BuilderDashboard from './BuilderDashboard';
import SupervisorDashboard from './SupervisorDashboard';
import ProjectManagerDashboard from './ProjectManagerDashboard';
import AccountantDashboard from './AccountantDashboard';
import AdminDashboard from './AdminDashboard';

export default function DashboardEngine() {
  const { user } = useAuth();
  const role = user?.role || 'SITE_SUPERVISOR';

  switch (role) {
    case 'BUILDER':
      return <BuilderDashboard />;
    case 'SITE_SUPERVISOR':
      return <SupervisorDashboard />;
    case 'PROJECT_MANAGER':
      return <ProjectManagerDashboard />;
    case 'ACCOUNTANT':
      return <AccountantDashboard />;
    case 'ADMIN':
      return <AdminDashboard />;
    default:
      return <SupervisorDashboard />;
  }
}
