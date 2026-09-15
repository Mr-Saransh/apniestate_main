import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { ProjectProvider } from '@/context/ProjectContext';
import { AppModeProvider } from '@/context/AppModeContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import AppLayout from '@/components/layout/AppLayout';
import RouteGuard from '@/components/shared/RouteGuard';
import SubscriptionBanner from '@/components/shared/SubscriptionBanner';

// Lazy-loaded pages for lightning-fast initial load & route code splitting
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const LandingPage = lazy(() => import('@/pages/LandingPageV3'));
const SignupPage = lazy(() => import('@/pages/SignupPage'));
const MyInvitationsPage = lazy(() => import('@/pages/MyInvitationsPage'));
const CompanyInvitationsPage = lazy(() => import('@/pages/CompanyInvitationsPage'));
const CompanyResignationsPage = lazy(() => import('@/pages/CompanyResignationsPage'));
const CompleteProfilePage = lazy(() => import('@/pages/CompleteProfilePage'));
const SubscriptionPage = lazy(() => import('@/pages/SubscriptionPage'));
const PendingApprovalPage = lazy(() => import('@/pages/PendingApprovalPage'));
const RenewSubscriptionPage = lazy(() => import('@/pages/RenewSubscriptionPage'));

// Admin pages
const AdminLoginPage = lazy(() => import('@/pages/admin/AdminLoginPage'));
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'));

// Core app pages
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const ProjectsPage = lazy(() => import('@/pages/ProjectsPage'));
const ProjectDetailPage = lazy(() => import('@/pages/ProjectDetailPage'));
const TasksPage = lazy(() => import('@/pages/TasksPage'));
const MorePage = lazy(() => import('@/pages/MorePage'));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const UsersPage = lazy(() => import('@/pages/UsersPage'));
const DocumentsPage = lazy(() => import('@/pages/DocumentsPage'));
const ReportsPage = lazy(() => import('@/pages/ReportsPage'));
const MilestoneReportPage = lazy(() => import('@/pages/MilestoneReportPage'));
const DailyLogsPage = lazy(() => import('@/pages/DailyLogsPage'));
const ExportAttendancePage = lazy(() => import('@/pages/ExportAttendancePage'));
const ExportDprPage = lazy(() => import('@/pages/ExportDprPage'));
const LeavesPage = lazy(() => import('@/pages/LeavesPage'));
const PayrollPage = lazy(() => import('@/pages/PayrollPage'));
const ApprovalsPage = lazy(() => import('@/pages/ApprovalsPage'));

// Workspaces
const ProgressWorkspace = lazy(() => import('@/pages/ProgressWorkspace'));
const PurchaseWorkspace = lazy(() => import('@/pages/PurchaseWorkspace'));
const FinanceWorkspace = lazy(() => import('@/pages/FinanceWorkspace'));
const OperationsWorkspace = lazy(() => import('@/pages/OperationsWorkspace'));
const CrmWorkspace = lazy(() => import('@/pages/CrmWorkspace'));

function PageFallback() {
  return (
    <div className="flex items-center justify-center min-h-[50vh] w-full">
      <div className="flex flex-col items-center gap-2.5">
        <div className="size-8 rounded-full border-3 border-[#2648E7] border-t-transparent animate-spin" />
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Loading...</p>
      </div>
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 60000,
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
                <Suspense fallback={<PageFallback />}>
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
                      <Route path="/channel-partners" element={<Navigate to="/crm?tab=channel-partners" replace />} />
                      <Route path="/crm-channel-partners" element={<Navigate to="/crm?tab=channel-partners" replace />} />

                      <Route element={<RouteGuard permission="projects.read" />}>
                        <Route path="/projects" element={<ProjectsPage />} />
                        <Route path="/projects/:id" element={<ProjectDetailPage />} />
                      </Route>

                      {/* Common unguarded routes within layout */}
                      <Route path="/more" element={<MorePage />} />
                      <Route path="/notifications" element={<NotificationsPage />} />
                      <Route path="/profile" element={<ProfilePage />} />
                      <Route path="/settings" element={<SettingsPage />} />

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
                        <Route path="/materials" element={<Navigate to="/purchase?tab=requests" replace />} />
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
                      </Route>
                      
                      <Route element={<RouteGuard permission="documents.read" />}>
                        <Route path="/documents" element={<DocumentsPage />} />
                      </Route>
                      <Route element={<RouteGuard permission="reports.read" />}>
                        <Route path="/reports" element={<ReportsPage />} />
                        <Route path="/milestone-report" element={<MilestoneReportPage />} />
                      </Route>

                      {/* Leftover routes */}
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
                </Suspense>
              </AppModeProvider>
            </BrowserRouter>
          </ProjectProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
