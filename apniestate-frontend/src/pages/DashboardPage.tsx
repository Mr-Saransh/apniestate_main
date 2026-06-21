import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { projectsApi, type Project } from '@/api/projects';
import StatCard from '@/components/shared/StatCard';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import StatusBadge from '@/components/shared/StatusBadge';
import {
  FolderKanban,
  MapPin,
  UserCheck,
  ClipboardList,
  Package,
  AlertTriangle,
  ChevronRight,
  Plus,
  Camera,
  FileText,
  Wallet,
  Calendar,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await projectsApi.getAll();
        if (res.data) setProjects(res.data);
      } catch {
        // use empty state
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner size="lg" />;

  const activeProjects = projects.filter((p) => p.status === 'ACTIVE').length;
  const totalSites = projects.reduce((sum, p) => sum + (p._count?.sites || 0), 0);
  const role = user?.role || 'BUILDER';

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 'var(--space-12)' }}>
      {/* Greeting */}
      <div className="page-header" style={{ marginBottom: 'var(--space-4)' }}>
        <div>
          <h1 className="page-title">
            {getGreeting()}, {user?.name?.split(' ')[0] || 'User'}
          </h1>
          <p className="page-subtitle">
            {getRoleSubtitle(role)}
          </p>
        </div>
      </div>

      {/* Welcoming 3D Claymorphic Banner */}
      <div className="dashboard-banner-container animate-scale-in">
        <div className="dashboard-banner-content">
          <h2 className="dashboard-banner-title">Welcome to your site center</h2>
          <p className="dashboard-banner-subtitle">
            Easily review construction phases, log daily worker updates, and record raw materials requests from your phone.
          </p>
        </div>
        <div className="dashboard-banner-image-wrap">
          <img src="/images/premium_dashboard_bg.png" alt="Welcome to your site center" className="dashboard-banner-img" />
        </div>
      </div>

      {/* Quick Actions — Role-Based */}
      <div className="section">
        <div className="section-title">Quick Actions</div>
        <div className="quick-actions">
          {getQuickActions(role).map((action) => (
            <div
              key={action.label}
              className="action-card"
              onClick={() => navigate(action.to)}
              id={`action-${action.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div className="action-card-icon" style={{ background: action.bgColor, color: action.color }}>
                <action.icon size={24} />
              </div>
              <div className="action-card-content">
                <div className="action-card-title">{action.label}</div>
                <div className="action-card-subtitle">{action.subtitle}</div>
              </div>
              <ChevronRight size={18} className="action-card-chevron" />
            </div>
          ))}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="section">
        <div className="section-title">Overview</div>
        <div className="stats-grid">
          <StatCard
            icon={<FolderKanban size={22} />}
            label="Projects"
            value={projects.length}
            color="var(--color-primary)"
            bgColor="var(--color-primary-50)"
          />
          <StatCard
            icon={<MapPin size={22} />}
            label="Active Sites"
            value={totalSites}
            color="var(--color-success)"
            bgColor="var(--color-success-bg)"
          />
          <StatCard
            icon={<ClipboardList size={22} />}
            label="Tasks"
            value={activeProjects * 5}
            trend={{ value: '12%', direction: 'up' }}
            color="var(--color-info)"
            bgColor="var(--color-info-bg)"
          />
          <StatCard
            icon={<AlertTriangle size={22} />}
            label="Pending"
            value={3}
            color="var(--color-warning)"
            bgColor="var(--color-warning-bg)"
          />
        </div>
      </div>

      {/* Active Projects */}
      {projects.length > 0 && (
        <div className="section">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
            <div className="section-title" style={{ marginBottom: 0 }}>Active Projects</div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/projects')}>
              View All
            </button>
          </div>
          <div className="card" style={{ overflow: 'hidden' }}>
            {projects.slice(0, 5).map((project, idx) => (
              <div
                key={project.id}
                className="list-card"
                onClick={() => navigate(`/projects/${project.id}`)}
                id={`project-item-${idx}`}
              >
                <div
                  className="list-card-icon"
                  style={{
                    background: 'var(--color-primary-50)',
                    color: 'var(--color-primary)',
                  }}
                >
                  <FolderKanban size={20} />
                </div>
                <div className="list-card-content">
                  <div className="list-card-title">{project.name}</div>
                  <div className="list-card-subtitle">
                    {project._count?.sites || 0} sites · Started {formatDate(project.start_date)}
                  </div>
                </div>
                <div className="list-card-meta">
                  <StatusBadge status={project.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Project FAB */}
      <button
        className="fab animate-pop-in"
        onClick={() => navigate('/projects')}
        aria-label="New Project"
        id="fab-new-project"
      >
        <Plus size={24} />
      </button>
    </div>
  );
}

/* ── Helper Functions ── */

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function getRoleSubtitle(role: string): string {
  switch (role) {
    case 'BUILDER':
      return "Here's your project overview for today";
    case 'SITE_SUPERVISOR':
      return "Here's what needs your attention today";
    case 'ACCOUNTANT':
      return 'Financial overview and pending actions';
    case 'PROJECT_MANAGER':
      return 'Project progress and resource status';
    default:
      return "Here's what's happening today";
  }
}

interface QuickAction {
  label: string;
  subtitle: string;
  to: string;
  icon: React.ComponentType<{ size: number }>;
  color: string;
  bgColor: string;
}

function getQuickActions(role: string): QuickAction[] {
  switch (role) {
    case 'SITE_SUPERVISOR':
      return [
        { label: 'Mark Attendance', subtitle: 'Daily workforce check-in', to: '/attendance', icon: UserCheck, color: 'var(--color-success)', bgColor: 'var(--color-success-bg)' },
        { label: "Today's Tasks", subtitle: 'View and update tasks', to: '/tasks', icon: ClipboardList, color: 'var(--color-primary)', bgColor: 'var(--color-primary-50)' },
        { label: 'Material Request', subtitle: 'Request site materials', to: '/materials', icon: Package, color: 'var(--color-warning)', bgColor: 'var(--color-warning-bg)' },
        { label: 'Progress Photos', subtitle: 'Upload site progress', to: '/documents', icon: Camera, color: 'var(--color-info)', bgColor: 'var(--color-info-bg)' },
      ];
    case 'ACCOUNTANT':
      return [
        { label: 'Record Expense', subtitle: 'Add new expense entry', to: '/finance', icon: Wallet, color: 'var(--color-danger)', bgColor: 'var(--color-danger-bg)' },
        { label: 'Pending Payments', subtitle: 'Review and approve', to: '/finance', icon: FileText, color: 'var(--color-warning)', bgColor: 'var(--color-warning-bg)' },
        { label: 'Financial Reports', subtitle: 'Budget vs actual', to: '/reports', icon: FileText, color: 'var(--color-primary)', bgColor: 'var(--color-primary-50)' },
      ];
    case 'PROJECT_MANAGER':
      return [
        { label: 'Site Progress', subtitle: 'Review milestones', to: '/projects', icon: MapPin, color: 'var(--color-success)', bgColor: 'var(--color-success-bg)' },
        { label: 'Task Board', subtitle: 'Manage team tasks', to: '/tasks', icon: ClipboardList, color: 'var(--color-primary)', bgColor: 'var(--color-primary-50)' },
        { label: 'Workforce', subtitle: 'Team attendance', to: '/attendance', icon: UserCheck, color: 'var(--color-info)', bgColor: 'var(--color-info-bg)' },
        { label: 'Inventory', subtitle: 'Stock levels', to: '/inventory', icon: Package, color: 'var(--color-warning)', bgColor: 'var(--color-warning-bg)' },
      ];
    default: // BUILDER
      return [
        { label: 'View Projects', subtitle: `${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} status`, to: '/projects', icon: FolderKanban, color: 'var(--color-primary)', bgColor: 'var(--color-primary-50)' },
        { label: 'Pending Approvals', subtitle: 'Material & payment requests', to: '/finance', icon: AlertTriangle, color: 'var(--color-cta)', bgColor: 'var(--color-cta-50)' },
        { label: 'Schedule', subtitle: 'Upcoming milestones', to: '/tasks', icon: Calendar, color: 'var(--color-success)', bgColor: 'var(--color-success-bg)' },
        { label: 'Reports', subtitle: 'Daily & financial', to: '/reports', icon: FileText, color: 'var(--color-info)', bgColor: 'var(--color-info-bg)' },
      ];
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
}
