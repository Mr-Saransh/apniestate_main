import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { projectsApi, type Project } from '@/api/projects';
import StatCard from '@/components/shared/StatCard';
import ProjectOverviewChart from '@/components/shared/ProjectOverviewChart';
import RecentActivity, { type Activity } from '@/components/shared/RecentActivity';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import {
  FolderKanban,
  ClipboardList,
  Wallet,
  Truck,
  Plus,
} from 'lucide-react';

const demoActivities: Activity[] = [
  {
    id: '1',
    type: 'completion',
    title: 'Site inspection completed',
    subtitle: 'Skyline Heights',
    time: '2h ago',
  },
  {
    id: '2',
    type: 'delivery',
    title: 'Material delivered',
    subtitle: 'Green Valley Residency',
    time: '4h ago',
  },
  {
    id: '3',
    type: 'payment',
    title: 'Payment approved',
    subtitle: 'PKR 2,680,000',
    time: '6h ago',
  },
  {
    id: '4',
    type: 'report',
    title: 'Daily report submitted',
    subtitle: 'Pearl Commercial Tower',
    time: '8h ago',
  },
  {
    id: '5',
    type: 'alert',
    title: 'Safety concern flagged',
    subtitle: 'Block C — Scaffolding',
    time: '1d ago',
  },
];

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

  // Demo chart data
  const chartLabels = projects.length > 0
    ? projects.slice(0, 5).map((p) => p.name.length > 12 ? p.name.slice(0, 12) + '…' : p.name)
    : ['Project 01', 'Project 02', 'Project 03', 'Project 04', 'Project 05'];
  const chartPlanned = projects.length > 0
    ? projects.slice(0, 5).map(() => Math.floor(Math.random() * 100) + 60)
    : [120, 180, 90, 150, 100];
  const chartActual = projects.length > 0
    ? projects.slice(0, 5).map(() => Math.floor(Math.random() * 80) + 40)
    : [100, 140, 80, 120, 75];

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Welcome back, {user?.name || 'User'}! Here's what's happening with your projects today.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/projects')} id="new-project-btn">
          <Plus size={18} />
          New Project
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard
          icon={<FolderKanban size={24} />}
          label="Total Projects"
          value={projects.length || 24}
          subtitle="Active"
          color="var(--color-primary)"
          bgColor="var(--color-primary-50)"
        />
        <StatCard
          icon={<ClipboardList size={24} />}
          label="Total Tasks"
          value={totalSites || 128}
          subtitle="In Progress"
          color="var(--color-secondary)"
          bgColor="rgba(0, 77, 64, 0.08)"
        />
        <StatCard
          icon={<Wallet size={24} />}
          label="Total Budget"
          value="PKR 48.5M"
          subtitle="Allocated"
          color="var(--color-accent)"
          bgColor="rgba(197, 160, 78, 0.08)"
        />
        <StatCard
          icon={<Truck size={24} />}
          label="Total Vendors"
          value={35}
          subtitle="On Board"
          color="var(--color-info)"
          bgColor="var(--color-info-bg)"
        />
      </div>

      {/* Charts & Activity */}
      <div className="content-grid">
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)' }}>
              Project Overview
            </h3>
          </div>
          <div className="card-body">
            <ProjectOverviewChart
              labels={chartLabels}
              planned={chartPlanned}
              actual={chartActual}
            />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)' }}>
              Recent Activity
            </h3>
            <button className="btn btn-ghost btn-sm">View All</button>
          </div>
          <div className="card-body" style={{ padding: 'var(--space-3) var(--space-4)' }}>
            <RecentActivity activities={demoActivities} />
          </div>
        </div>
      </div>

      {/* Projects Quick List */}
      {projects.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)' }}>
              My Projects
            </h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/projects')}>
              View All
            </button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-container" style={{ border: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Project Name</th>
                    <th>Status</th>
                    <th>Sites</th>
                    <th>Start Date</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.slice(0, 5).map((project) => (
                    <tr
                      key={project.id}
                      onClick={() => navigate(`/projects/${project.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ fontWeight: 'var(--font-weight-medium)' }}>{project.name}</td>
                      <td>
                        <span className={`badge badge-${project.status.toLowerCase().replace(/_/g, '-')}`}>
                          {project.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>{project._count?.sites || 0} sites</td>
                      <td style={{ color: 'var(--color-text-secondary)' }}>
                        {new Date(project.start_date).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
