import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import ProjectsPage from '@/pages/ProjectsPage';
import ProjectDetailPage from '@/pages/ProjectDetailPage';
import SiteManagementPage from '@/pages/SiteManagementPage';
import UsersPage from '@/pages/UsersPage';
import ComingSoonPage from '@/pages/ComingSoonPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected — wrapped by AppLayout which handles auth check */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
            <Route path="/site-management" element={<SiteManagementPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/tasks" element={<ComingSoonPage pageKey="tasks" />} />
            <Route path="/finance" element={<ComingSoonPage pageKey="finance" />} />
            <Route path="/vendors" element={<ComingSoonPage pageKey="vendors" />} />
            <Route path="/clients" element={<ComingSoonPage pageKey="clients" />} />
            <Route path="/reports" element={<ComingSoonPage pageKey="reports" />} />
            <Route path="/documents" element={<ComingSoonPage pageKey="documents" />} />
            <Route path="/messages" element={<ComingSoonPage pageKey="messages" />} />
            <Route path="/settings" element={<ComingSoonPage pageKey="settings" />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
