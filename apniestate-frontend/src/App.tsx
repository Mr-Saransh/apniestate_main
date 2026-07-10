import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import AppLayout from '@/components/layout/AppLayout';
import LoginPage from '@/pages/LoginPage';
import LandingPage from '@/pages/LandingPage';
import SignupPage from '@/pages/SignupPage';
import WorkspaceSelectPage from '@/pages/WorkspaceSelectPage';
import OnboardingPage from '@/pages/OnboardingPage';
import MyInvitationsPage from '@/pages/MyInvitationsPage';
import CompanyInvitationsPage from '@/pages/CompanyInvitationsPage';
import CompanyResignationsPage from '@/pages/CompanyResignationsPage';
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
import PayrollPage from '@/pages/PayrollPage';
import ApprovalsPage from '@/pages/ApprovalsPage';
import RouteGuard from '@/components/shared/RouteGuard';
// New Figma pages
import CalendarPage from '@/pages/CalendarPage';
import EquipmentPage from '@/pages/EquipmentPage';
import MaterialRequestsPage from '@/pages/MaterialRequestsPage';
import TimelinePage from '@/pages/TimelinePage';
import DailyLogsPage from '@/pages/DailyLogsPage';
import ExportAttendancePage from '@/pages/ExportAttendancePage';
import ExportDprPage from '@/pages/ExportDprPage';
import ProfilePage from '@/pages/ProfilePage';
import MilestonesPage from '@/pages/MilestonesPage';
import PurchaseOrdersPage from '@/pages/PurchaseOrdersPage';
import ExpensesPage from '@/pages/ExpensesPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5000,
    },
  },
});

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/select-workspace" element={<WorkspaceSelectPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/my-invitations" element={<MyInvitationsPage />} />

              {/* Protected — wrapped by AppLayout which handles auth check */}
              <Route element={<AppLayout />}>
                {/* Universally checked by config */}
                <Route element={<RouteGuard />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/projects" element={<ProjectsPage />} />
                  <Route path="/projects/:id" element={<ProjectDetailPage />} />
                  <Route path="/more" element={<MorePage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/milestones" element={<MilestonesPage />} />
                  <Route path="/dpr" element={<DprPage />} />
                  {/* New Figma pages */}
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route path="/timeline" element={<TimelinePage />} />
                  <Route path="/daily-logs" element={<DailyLogsPage />} />
                  <Route path="/export-attendance" element={<ExportAttendancePage />} />
                  <Route path="/export-dpr" element={<ExportDprPage />} />
                </Route>

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
                  <Route path="/users/invitations" element={<CompanyInvitationsPage />} />
                  <Route path="/users/resignations" element={<CompanyResignationsPage />} />
                </Route>
                <Route element={<RouteGuard permission="sites.read" />}>
                  <Route path="/sites" element={<SitesPage />} />
                </Route>
                <Route element={<RouteGuard permission="materials.read" />}>
                  <Route path="/materials" element={<MaterialsPage />} />
                  <Route path="/material-requests" element={<MaterialRequestsPage />} />
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
                  <Route path="/equipment" element={<EquipmentPage />} />
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
                <Route element={<RouteGuard permission="finance.read" />}>
                  <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
                  <Route path="/expenses" element={<ExpensesPage />} />
                </Route>
                <Route element={<RouteGuard permission="payments.read" />}>
                  <Route path="/payments" element={<PaymentsPage />} />
                </Route>
                <Route element={<RouteGuard permission="budgets.read" />}>
                  <Route path="/budgets" element={<BudgetsPage />} />
                </Route>
                <Route element={<RouteGuard permission="workers.read" />}>
                  <Route path="/payroll" element={<PayrollPage />} />
                </Route>
                <Route element={<RouteGuard permission="finance.read" />}>
                  <Route path="/approvals" element={<ApprovalsPage />} />
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

