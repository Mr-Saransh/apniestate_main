import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import LoginPage from '@/pages/LoginPage';
import LandingPage from '@/pages/LandingPage';
import SignupPage from '@/pages/SignupPage';
import OnboardingPage from '@/pages/OnboardingPage';
import DashboardPage from '@/pages/DashboardPage';
import ProjectsPage from '@/pages/ProjectsPage';
import ProjectDetailPage from '@/pages/ProjectDetailPage';
import TasksPage from '@/pages/TasksPage';
import AttendancePage from '@/pages/AttendancePage';
import InventoryPage from '@/pages/InventoryPage';
import MorePage from '@/pages/MorePage';
import NotificationsPage from '@/pages/NotificationsPage';
import SettingsPage from '@/pages/SettingsPage';
import UsersPage from '@/pages/UsersPage';
import SitesPage from '@/pages/SitesPage';
import MaterialsPage from '@/pages/MaterialsPage';
import FinancePage from '@/pages/FinancePage';
import VendorsPage from '@/pages/VendorsPage';
import DocumentsPage from '@/pages/DocumentsPage';
import ReportsPage from '@/pages/ReportsPage';
import WorkersPage from '@/pages/WorkersPage';
import ContractorsPage from '@/pages/ContractorsPage';
import LeavesPage from '@/pages/LeavesPage';
import InvoicesPage from '@/pages/InvoicesPage';
import PaymentsPage from '@/pages/PaymentsPage';
import BudgetsPage from '@/pages/BudgetsPage';
import DprPage from '@/pages/DprPage';
import RouteGuard from '@/components/shared/RouteGuard';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />

          {/* Protected — wrapped by AppLayout which handles auth check */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
            <Route path="/more" element={<MorePage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/dpr" element={<DprPage />} />

            {/* Guarded Modules */}
            <Route element={<RouteGuard permission="tasks.read" />}>
              <Route path="/tasks" element={<TasksPage />} />
            </Route>
            <Route element={<RouteGuard permission="attendance.read" />}>
              <Route path="/attendance" element={<AttendancePage />} />
            </Route>
            <Route element={<RouteGuard permission="inventory.read" />}>
              <Route path="/inventory" element={<InventoryPage />} />
            </Route>
            <Route element={<RouteGuard permission="users.read" />}>
              <Route path="/users" element={<UsersPage />} />
            </Route>
            <Route element={<RouteGuard permission="sites.read" />}>
              <Route path="/sites" element={<SitesPage />} />
            </Route>
            <Route element={<RouteGuard permission="materials.read" />}>
              <Route path="/materials" element={<MaterialsPage />} />
            </Route>
            <Route element={<RouteGuard permission="finance.read" />}>
              <Route path="/finance" element={<FinancePage />} />
            </Route>
            <Route element={<RouteGuard permission="vendors.read" />}>
              <Route path="/vendors" element={<VendorsPage />} />
            </Route>
            <Route element={<RouteGuard permission="documents.read" />}>
              <Route path="/documents" element={<DocumentsPage />} />
            </Route>
            <Route element={<RouteGuard permission="reports.read" />}>
              <Route path="/reports" element={<ReportsPage />} />
            </Route>
            
            {/* New Guarded Modules */}
            <Route element={<RouteGuard permission="workers.read" />}>
              <Route path="/workers" element={<WorkersPage />} />
            </Route>
            <Route element={<RouteGuard permission="contractors.read" />}>
              <Route path="/contractors" element={<ContractorsPage />} />
            </Route>
            <Route element={<RouteGuard permission="leaves.read" />}>
              <Route path="/leaves" element={<LeavesPage />} />
            </Route>
            <Route element={<RouteGuard permission="invoices.read" />}>
              <Route path="/invoices" element={<InvoicesPage />} />
            </Route>
            <Route element={<RouteGuard permission="payments.read" />}>
              <Route path="/payments" element={<PaymentsPage />} />
            </Route>
            <Route element={<RouteGuard permission="budgets.read" />}>
              <Route path="/budgets" element={<BudgetsPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}


