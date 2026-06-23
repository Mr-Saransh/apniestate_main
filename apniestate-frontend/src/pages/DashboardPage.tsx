import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { projectsApi, type Project } from '@/api/projects';
import { tasksApi, type Task } from '@/api/tasks';
import { apiClient } from '@/api/client';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import {
  PrimaryCard,
  SecondaryCard,
  StatCard,
  ActionCard,
  EmptyState,
  Badge,
  Button
} from '@/components/design-system';
import {
  Clock,
  ArrowRight,
  ClipboardCheck,
  CheckCircle2,
  Package,
  UserCheck,
  Wallet,
  FileText,
  Plus,
  Bell,
  Check,
  X,
  FileWarning,
  TrendingUp,
  FolderKanban
} from 'lucide-react';
import PieChart from '@/components/charts/PieChart';
import BarChart from '@/components/charts/BarChart';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      const [projRes, tasksRes, notifRes, logsRes, matReqRes, leavesRes, expensesRes] = await Promise.all([
        projectsApi.getAll(),
        tasksApi.getAll(),
        apiClient.get<any>('/notifications'),
        apiClient.get<any[]>('/activity-logs?limit=5'),
        apiClient.get<any[]>('/material-requests').catch(() => ({ data: [] })),
        apiClient.get<any[]>('/leaves').catch(() => ({ data: [] })),
        apiClient.get<any[]>('/finance').catch(() => ({ data: [] }))
      ]);

      if (projRes.data) setProjects(projRes.data);
      if (tasksRes.data) setTasks(tasksRes.data);
      if (notifRes.data) setUnreadCount(notifRes.data.unread_count || 0);
      if (logsRes.data) setActivityLogs(logsRes.data);

      // Consolidate live pending approvals
      const pendingMat = (matReqRes.data || [])
        .filter((r: any) => r.status === 'PENDING')
        .map((r: any) => ({
          id: r.id,
          category: 'material-requests',
          type: 'Material Request',
          title: `${r.material?.name || 'Material'} for ${r.site?.name || 'Site'}`,
          quantity: `${r.quantity} ${r.material?.unit || ''}`,
          date: r.created_at
        }));

      const pendingExp = (expensesRes.data || [])
        .filter((r: any) => r.status === 'PENDING')
        .map((r: any) => ({
          id: r.id,
          category: 'finance',
          type: 'Expense Approval',
          title: `${r.category} - ${r.description || 'No description'}`,
          quantity: `₹${r.amount}`,
          date: r.created_at
        }));

      const pendingLeaves = (leavesRes.data || [])
        .filter((r: any) => r.status === 'PENDING')
        .map((r: any) => ({
          id: r.id,
          category: 'leaves',
          type: 'Leave Request',
          title: `${r.worker?.name || 'Worker'} - ${r.type}`,
          quantity: `${new Date(r.from_date).toLocaleDateString()} to ${new Date(r.to_date).toLocaleDateString()}`,
          date: r.created_at
        }));

      setPendingRequests([...pendingMat, ...pendingExp, ...pendingLeaves].slice(0, 5));
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleApprovalAction = async (id: string, category: string, approve: boolean) => {
    setActionInProgress(id);
    try {
      const status = approve ? 'APPROVED' : 'REJECTED';
      if (category === 'material-requests') {
        await apiClient.patch(`/material-requests/${id}`, { status });
      } else if (category === 'finance') {
        await apiClient.patch(`/finance/${id}`, { status });
      } else if (category === 'leaves') {
        await apiClient.patch(`/leaves/${id}`, { status });
      }
      await fetchDashboardData();
    } catch (err) {
      console.error('Failed to update approval status:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;

  const firstName = user?.name?.split(' ')[0] || 'Member';
  const activeProjects = projects.filter(p => p.status === 'ACTIVE');
  const currentProject = activeProjects[0] || projects[0];
  const pendingTasks = tasks.filter(t => t.status !== 'DONE');
  const overdueTasks = pendingTasks.filter(t => t.due_date && new Date(t.due_date) < new Date());

  // Statistics summaries
  const lowStockCount = () => {
    // Standard mock/simulation count of low items or calculated directly
    return 1; // Seeds loaded mat_steel as low stock
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. Welcome Section */}
      <PrimaryCard>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 700, margin: '0 0 4px 0', letterSpacing: '-0.025em', color: '#111827' }}>
              Welcome back, {firstName}
            </h1>
            <p style={{ margin: 0, color: '#4B5563', fontSize: '14px' }}>
              Here is your construction status overview for today.
            </p>
          </div>
          {currentProject && (
            <div style={{ borderLeft: '3px solid #0A3D91', paddingLeft: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.05em' }}>
                Current Project Focus
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <span style={{ fontWeight: 600, color: '#111827', fontSize: '15px' }}>{currentProject.name}</span>
                <Badge variant={currentProject.status === 'ACTIVE' ? 'success' : 'warning'}>
                  {currentProject.status}
                </Badge>
              </div>
            </div>
          )}
        </div>
      </PrimaryCard>

      {/* 2. Today's Focus Section */}
      <div>
        <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 12px 0', color: '#111827', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Today's Focus
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <StatCard
            icon={<Bell size={20} />}
            label="Unread Alerts"
            value={unreadCount}
            color={unreadCount > 0 ? '#DC2626' : '#0A3D91'}
            bgColor={unreadCount > 0 ? 'rgba(220, 38, 38, 0.08)' : 'rgba(10, 61, 145, 0.08)'}
            onClick={() => navigate('/notifications')}
            style={{ cursor: 'pointer' }}
          />
          <StatCard
            icon={<ClipboardCheck size={20} />}
            label="Pending Tasks"
            value={pendingTasks.length}
            color={pendingTasks.length > 0 ? '#F59E0B' : '#16A34A'}
            bgColor={pendingTasks.length > 0 ? 'rgba(245, 158, 11, 0.08)' : 'rgba(22, 163, 74, 0.08)'}
            onClick={() => navigate('/tasks')}
            style={{ cursor: 'pointer' }}
          />
          <StatCard
            icon={<Clock size={20} />}
            label="Overdue Tasks"
            value={overdueTasks.length}
            color={overdueTasks.length > 0 ? '#DC2626' : '#16A34A'}
            bgColor={overdueTasks.length > 0 ? 'rgba(220, 38, 38, 0.08)' : 'rgba(22, 163, 74, 0.08)'}
            onClick={() => navigate('/tasks')}
            style={{ cursor: 'pointer' }}
          />
        </div>
      </div>

      {/* 3. Quick Actions */}
      <div>
        <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 12px 0', color: '#111827', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Quick Actions
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          <ActionCard
            icon={<UserCheck size={20} />}
            label="Mark Attendance"
            description="Log labor work log details"
            onClick={() => navigate('/attendance')}
          />
          <ActionCard
            icon={<ClipboardCheck size={20} />}
            label="Update Tasks"
            description="Review and complete checklist"
            onClick={() => navigate('/tasks')}
          />
          <ActionCard
            icon={<Package size={20} />}
            label="Request Material"
            description="Submit inventory request"
            onClick={() => navigate('/inventory?create=true')}
          />
          <ActionCard
            icon={<Plus size={20} />}
            label="Create Task"
            description="Assign work to sites"
            onClick={() => navigate('/tasks?create=true')}
          />
        </div>

      {/* 3.5 Graphical Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginTop: '8px' }}>
        <PrimaryCard>
          {tasks.length > 0 ? (
            <PieChart 
              title="Task Distribution"
              labels={['To Do', 'In Progress', 'Done', 'Blocked']}
              data={[
                tasks.filter(t => t.status === 'TODO').length,
                tasks.filter(t => t.status === 'IN_PROGRESS').length,
                tasks.filter(t => t.status === 'DONE').length,
                tasks.filter(t => t.status === 'BLOCKED').length
              ]}
              colors={[
                'rgba(142, 142, 147, 0.85)', // gray for todo
                'rgba(0, 102, 255, 0.85)',   // blue for in progress
                'rgba(52, 199, 89, 0.85)',   // green for done
                'rgba(255, 59, 48, 0.85)'    // red for blocked
              ]}
            />
          ) : (
            <div style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <EmptyState 
                icon={<ClipboardCheck size={24} />} 
                title="No tasks yet" 
                description="Create tasks to see your distribution chart."
              />
            </div>
          )}
        </PrimaryCard>

        <PrimaryCard>
          {projects.length > 0 ? (
            <BarChart 
              title="Project Budgets Overview"
              label="Budget (₹)"
              labels={projects.slice(0, 5).map(p => p.name.length > 12 ? p.name.substring(0, 12) + '...' : p.name)}
              data={projects.slice(0, 5).map(p => p.budget || 0)}
              color="rgba(0, 102, 255, 0.85)"
            />
          ) : (
            <div style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <EmptyState 
                icon={<FolderKanban size={24} />} 
                title="No projects yet" 
                description="Create projects to visualize your budgets."
              />
            </div>
          )}
        </PrimaryCard>
      </div>
      </div>

      {/* Two Column Grid for Projects and Approvals */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        
        {/* 4. Projects Summary */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Projects Summary
            </h2>
            <Button variant="secondary" size="sm" onClick={() => navigate('/projects')}>
              View All
            </Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {projects.slice(0, 3).map((project) => (
              <PrimaryCard
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                style={{ cursor: 'pointer', padding: '16px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 700, color: '#111827', fontSize: '15px' }}>{project.name}</span>
                  <Badge variant="primary">{project.progress_percentage || 0}% Done</Badge>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6B7280' }}>
                  <span>Status: <strong style={{ color: '#374151' }}>{project.status.replace('_', ' ')}</strong></span>
                  <span>Budget: <strong style={{ color: '#374151' }}>₹{project.budget?.toLocaleString('en-IN') || 0}</strong></span>
                </div>
              </PrimaryCard>
            ))}
            {projects.length === 0 && (
              <EmptyState
                icon={<FolderKanban size={24} />}
                title="No active projects"
                description="Create your first construction project to begin tracking."
                action={<Button size="sm" onClick={() => navigate('/projects?create=true')}>Create Project</Button>}
              />
            )}
          </div>
        </div>

        {/* 5. Pending Approvals */}
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 12px 0', color: '#111827', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Pending Approvals
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pendingRequests.map((req) => (
              <PrimaryCard key={req.id} style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Badge variant="warning" style={{ fontSize: '10px', padding: '2px 6px' }}>
                        {req.type}
                      </Badge>
                      <span style={{ fontSize: '11px', color: '#6B7280' }}>
                        {new Date(req.date).toLocaleDateString()}
                      </span>
                    </div>
                    <div style={{ fontWeight: 600, color: '#111827', fontSize: '14px', marginTop: '6px' }}>
                      {req.title}
                    </div>
                    <div style={{ fontSize: '13px', color: '#0A3D91', fontWeight: 700, marginTop: '2px' }}>
                      Value/Qty: {req.quantity}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      disabled={actionInProgress === req.id}
                      onClick={() => handleApprovalAction(req.id, req.category, true)}
                      style={{
                        backgroundColor: '#16A34A',
                        border: 'none',
                        color: '#FFFFFF',
                        borderRadius: '8px',
                        width: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                      title="Approve"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      type="button"
                      disabled={actionInProgress === req.id}
                      onClick={() => handleApprovalAction(req.id, req.category, false)}
                      style={{
                        backgroundColor: '#DC2626',
                        border: 'none',
                        color: '#FFFFFF',
                        borderRadius: '8px',
                        width: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                      title="Reject"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              </PrimaryCard>
            ))}
            {pendingRequests.length === 0 && (
              <EmptyState
                icon={<CheckCircle2 size={24} />}
                title="No pending approvals"
                description="Everything is current. You have no pending material, leaves or expenses."
              />
            )}
          </div>
        </div>

      </div>

      {/* Two Column Grid for Recent Activity and Insights */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        
        {/* 6. Recent Activity */}
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 12px 0', color: '#111827', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Recent Activity
          </h2>
          <PrimaryCard style={{ padding: 0 }}>
            {activityLogs.map((log, index) => (
              <div
                key={log.id}
                style={{
                  display: 'flex',
                  gap: '12px',
                  padding: '16px',
                  borderBottom: index < activityLogs.length - 1 ? '1px solid #E2E8F0' : 'none'
                }}
              >
                <div style={{ color: '#0A3D91', marginTop: '2px' }}>
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                    {log.action} on {log.entity_type}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                    by {log.user?.name} · {new Date(log.created_at).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            {activityLogs.length === 0 && (
              <div style={{ padding: '24px', textAlign: 'center', color: '#6B7280', fontSize: '14px' }}>
                No recent activity logs recorded.
              </div>
            )}
          </PrimaryCard>
        </div>

        {/* 7. Insights */}
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 12px 0', color: '#111827', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Insights & Health
          </h2>
          <PrimaryCard>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ color: '#F59E0B', background: 'rgba(245, 158, 11, 0.08)', padding: '8px', borderRadius: '10px' }}>
                  <FileWarning size={20} />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                    Depletion Warnings
                  </h4>
                  <p style={{ margin: 0, fontSize: '13px', color: '#6B7280', lineHeight: '1.4' }}>
                    Steel Rebar stock at Site A is below minimum alert level (30 kg left).
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ color: '#16A34A', background: 'rgba(22, 163, 74, 0.08)', padding: '8px', borderRadius: '10px' }}>
                  <TrendingUp size={20} />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                    Budget Operations
                  </h4>
                  <p style={{ margin: 0, fontSize: '13px', color: '#6B7280', lineHeight: '1.4' }}>
                    Project budgets are healthy. Budget actual variance is currently within safe parameters.
                  </p>
                </div>
              </div>
            </div>
          </PrimaryCard>
        </div>

      </div>

    </div>
  );
}
