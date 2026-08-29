import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { ProjectProvider } from '@/context/ProjectContext';
import { AppModeProvider } from '@/context/AppModeContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import AppLayout from '@/components/layout/AppLayout';
import LoginPage from '@/pages/LoginPage';
import LandingPage from '@/pages/LandingPage';
import SignupPage from '@/pages/SignupPage';
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
import VendorsPage from '@/pages/VendorsPage';
import DocumentsPage from '@/pages/DocumentsPage';
import ReportsPage from '@/pages/ReportsPage';
import MilestoneReportPage from '@/pages/MilestoneReportPage';
import FinancePage from '@/pages/FinancePage';
import RouteGuard from '@/components/shared/RouteGuard';
import CalendarPage from '@/pages/CalendarPage';
import EquipmentPage from '@/pages/EquipmentPage';
import MaterialRequestsPage from '@/pages/MaterialRequestsPage';
import DailyLogsPage from '@/pages/DailyLogsPage';
import ExportAttendancePage from '@/pages/ExportAttendancePage';
import ExportDprPage from '@/pages/ExportDprPage';
import ProfilePage from '@/pages/ProfilePage';
import MilestonesPage from '@/pages/MilestonesPage';
import PurchaseOrdersPage from '@/pages/PurchaseOrdersPage';
import ExpensesPage from '@/pages/ExpensesPage';
import LeavesPage from '@/pages/LeavesPage';
import PayrollPage from '@/pages/PayrollPage';
import ApprovalsPage from '@/pages/ApprovalsPage';

import ProgressWorkspace from '@/pages/ProgressWorkspace';
import PurchaseWorkspace from '@/pages/PurchaseWorkspace';
import FinanceWorkspace from '@/pages/FinanceWorkspace';
import OperationsWorkspace from '@/pages/OperationsWorkspace';
import CrmWorkspace from '@/pages/CrmWorkspace';

import AdminLoginPage from '@/pages/admin/AdminLoginPage';
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import CompleteProfilePage from '@/pages/CompleteProfilePage';
import SubscriptionPage from '@/pages/SubscriptionPage';
import PendingApprovalPage from '@/pages/PendingApprovalPage';
import RenewSubscriptionPage from '@/pages/RenewSubscriptionPage';
import SubscriptionBanner from '@/components/shared/SubscriptionBanner';

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
          <ProjectProvider>
            <BrowserRouter>
              <AppModeProvider>
                <SubscriptionBanner />
                <Routes>
                  {/* Public routes */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                  <Route path="/landing" element={<LandingPage />} />
                  
                  {/* Subscription & Profile Flow */}
                  <Route path="/complete-profile" element={<CompleteProfilePage />} />
                  <Route path="/subscription" element={<SubscriptionPage />} />
                  <Route path="/pending-approval" element={<PendingApprovalPage />} />
                  <Route path="/renew" element={<RenewSubscriptionPage />} />

                  {/* Admin Panel */}
                  <Route path="/apni-admin" element={<Navigate to="/apni-admin/login" replace />} />
                  <Route path="/apni-admin/login" element={<AdminLoginPage />} />
                  <Route path="/apni-admin/dashboard" element={<AdminDashboardPage />} />

                  {/* Guarded onboarding/invitations */}
                  <Route path="/my-invitations" element={<MyInvitationsPage />} />

                  {/* Main App */}
                  <Route path="/" element={<AppLayout />}>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    
                    {/* CRM Workspace & Direct Aliases */}
                    <Route path="/crm" element={<CrmWorkspace />} />
                    <Route path="/leads" element={<Navigate to="/crm?tab=leads" replace />} />
                    <Route path="/pipeline" element={<Navigate to="/crm?tab=pipeline" replace />} />
                    <Route path="/followups" element={<Navigate to="/crm?tab=followups" replace />} />
                    <Route path="/crm-customers" element={<Navigate to="/crm?tab=customers" replace />} />
                    <Route path="/crm-activities" element={<Navigate to="/crm?tab=activities" replace />} />
                    <Route path="/crm-properties" element={<Navigate to="/crm?tab=properties" replace />} />

                    <Route element={<RouteGuard permission="projects.read" />}>
                      <Route path="/projects" element={<ProjectsPage />} />
                      <Route path="/projects/:id" element={<ProjectDetailPage />} />
                    </Route>

                    {/* Common unguarded routes within layout */}
                    <Route path="/more" element={<MorePage />} />
                    <Route path="/notifications" element={<NotificationsPage />} />
                    <Route path="/profile" element={<ProfilePage />} />

                    {/* Guarded Modules */}
                    <Route element={<RouteGuard permission="tasks.read" />}>
                      <Route path="/tasks" element={<TasksPage />} />
                    </Route>

                    {/* Progress Workspace */}
                    <Route element={<RouteGuard permission="sites.read" />}>
                      <Route path="/progress" element={<ProgressWorkspace />} />
                      <Route path="/timeline" element={<Navigate to="/progress?tab=timeline" replace />} />
                      <Route path="/milestones" element={<Navigate to="/progress?tab=milestones" replace />} />
                      <Route path="/dpr" element={<Navigate to="/progress?tab=dpr" replace />} />
                      <Route path="/calendar" element={<Navigate to="/progress?tab=calendar" replace />} />
                    </Route>

                    {/* Purchase Workspace */}
                    <Route element={<RouteGuard permission="materials.read" />}>
                      <Route path="/purchase" element={<PurchaseWorkspace />} />
                      <Route path="/boq" element={<Navigate to="/purchase?tab=boq" replace />} />
                      <Route path="/material-requests" element={<Navigate to="/purchase?tab=requests" replace />} />
                      <Route path="/purchase-orders" element={<Navigate to="/purchase?tab=orders" replace />} />
                      <Route path="/inventory" element={<Navigate to="/purchase?tab=inventory" replace />} />
                      <Route path="/materials" element={<Navigate to="/purchase?tab=materials" replace />} />
                      <Route path="/vendors" element={<Navigate to="/purchase?tab=vendors" replace />} />
                    </Route>

                    {/* Finance Workspace */}
                    <Route element={<RouteGuard permission="finance.read" />}>
                      <Route path="/finance" element={<FinanceWorkspace />} />
                      <Route path="/cashbook" element={<Navigate to="/finance?tab=cashbook" replace />} />
                      <Route path="/expenses" element={<Navigate to="/finance?tab=expenses" replace />} />
                      <Route path="/invoices" element={<Navigate to="/finance?tab=invoices" replace />} />
                      <Route path="/payments" element={<Navigate to="/finance?tab=payments" replace />} />
                      <Route path="/budgets" element={<Navigate to="/finance?tab=budgets" replace />} />
                    </Route>

                    {/* Operations Workspace */}
                    <Route element={<RouteGuard permission="sites.read" />}>
                      <Route path="/operations" element={<OperationsWorkspace />} />
                      <Route path="/attendance" element={<Navigate to="/operations?tab=labour" replace />} />
                      <Route path="/equipment" element={<Navigate to="/operations?tab=equipment" replace />} />
                      <Route path="/sites" element={<Navigate to="/operations?tab=sites" replace />} />
                      <Route path="/contractors" element={<Navigate to="/operations?tab=contractors" replace />} />
                      <Route path="/workers" element={<Navigate to="/operations?tab=labour" replace />} />
                    </Route>

                    <Route element={<RouteGuard permission="users.read" />}>
                      <Route path="/users" element={<UsersPage />} />
                      <Route path="/users/invitations" element={<CompanyInvitationsPage />} />
                      <Route path="/users/resignations" element={<CompanyResignationsPage />} />
                      <Route path="/settings" element={<SettingsPage />} />
                    </Route>
                    
                    <Route element={<RouteGuard permission="documents.read" />}>
                      <Route path="/documents" element={<DocumentsPage />} />
                    </Route>
                    <Route element={<RouteGuard permission="reports.read" />}>
                      <Route path="/reports" element={<ReportsPage />} />
                      <Route path="/milestone-report" element={<MilestoneReportPage />} />
                    </Route>

                    {/* Leftover routes that weren't assigned workspaces yet */}
                    <Route path="/daily-logs" element={<DailyLogsPage />} />
                    <Route path="/export-attendance" element={<ExportAttendancePage />} />
                    <Route path="/export-dpr" element={<ExportDprPage />} />
                    <Route path="/leaves" element={<LeavesPage />} />
                    <Route path="/payroll" element={<PayrollPage />} />
                    <Route path="/approvals" element={<ApprovalsPage />} />
                    <Route path="/cost-dashboard" element={<Navigate to="/finance?tab=cashbook" replace />} />
                    <Route path="/boq-approvals" element={<Navigate to="/purchase?tab=boq" replace />} />
                  </Route>
                </Routes>
              </AppModeProvider>
            </BrowserRouter>
          </ProjectProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
