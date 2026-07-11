const fs = require('fs');

const appTsxPath = 'src/App.tsx';
let content = fs.readFileSync(appTsxPath, 'utf8');

// Ensure Navigate is imported
content = content.replace(/import { BrowserRouter, Routes, Route } from 'react-router-dom';/, "import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';");

// Add Workspace imports before QueryClient
if (!content.includes('ProgressWorkspace')) {
  content = content.replace(
    'const queryClient = new QueryClient',
    `import ProgressWorkspace from '@/pages/ProgressWorkspace';\nimport PurchaseWorkspace from '@/pages/PurchaseWorkspace';\nimport FinanceWorkspace from '@/pages/FinanceWorkspace';\nimport OperationsWorkspace from '@/pages/OperationsWorkspace';\n\nconst queryClient = new QueryClient`
  );
}

const replacement = `{/* Guarded Modules */}
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
                </Route>
                
                <Route element={<RouteGuard permission="documents.read" />}>
                  <Route path="/documents" element={<DocumentsPage />} />
                </Route>
                <Route element={<RouteGuard permission="reports.read" />}>
                  <Route path="/reports" element={<ReportsPage />} />
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
`;

const startIndex = content.indexOf('{/* Guarded Modules */}');
const endIndexStr = '</Route>\n              </Route>\n            </Routes>';
const endIndexStr2 = '</Route>\r\n              </Route>\r\n            </Routes>';
let endIndex = content.indexOf(endIndexStr);
let usedStr = endIndexStr;
if (endIndex === -1) {
    endIndex = content.indexOf(endIndexStr2);
    usedStr = endIndexStr2;
}

if (startIndex !== -1 && endIndex !== -1) {
    const before = content.substring(0, startIndex);
    const after = content.substring(endIndex);
    fs.writeFileSync(appTsxPath, before + replacement + after);
    console.log('Success');
} else {
    console.log('Markers not found', startIndex, endIndex);
}
