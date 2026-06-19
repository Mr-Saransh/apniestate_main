import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsApi, type Project } from '@/api/projects';
import StatusBadge from '@/components/shared/StatusBadge';
import ProgressBar from '@/components/shared/ProgressBar';
import StatCard from '@/components/shared/StatCard';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { ArrowLeft, ClipboardList, MapPin, Users, ShieldAlert, Calendar, Wallet } from 'lucide-react';

const tabs = ['Overview', 'Tasks', 'Site Updates', 'Documents', 'Finance'];

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');

  useEffect(() => {
    async function fetch() {
      try {
        const res = await projectsApi.getById(id!);
        if (res.data) setProject(res.data);
      } catch {
        // handle error
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [id]);

  if (loading) return <LoadingSpinner size="lg" />;
  if (!project) {
    return (
      <div className="empty-state" style={{ minHeight: '60vh' }}>
        <div className="empty-state-title">Project not found</div>
        <button className="btn btn-primary" onClick={() => navigate('/projects')} style={{ marginTop: 'var(--space-4)' }}>
          Back to Projects
        </button>
      </div>
    );
  }

  const progress = project.status === 'COMPLETED' ? 100
    : project.status === 'ACTIVE' ? 78
    : project.status === 'ON_HOLD' ? 45
    : 15;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <button
          className="btn btn-ghost btn-icon"
          onClick={() => navigate('/projects')}
          aria-label="Back to projects"
        >
          <ArrowLeft size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <h1 className="page-title" style={{ margin: 0 }}>{project.name}</h1>
            <StatusBadge status={project.status} />
          </div>
          {project.description && (
            <p className="page-subtitle" style={{ marginTop: 'var(--space-1)' }}>
              {project.description}
            </p>
          )}
        </div>
        <button className="btn btn-outline" id="edit-project-btn">
          Edit
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 'var(--space-6)' }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'Overview' ? (
        <div className="animate-fade-in">
          {/* Project Info */}
          <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-5)' }}>
                <div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>
                    Project Status
                  </div>
                  <StatusBadge status={project.status} />
                </div>
                <div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>
                    Start Date
                  </div>
                  <div style={{ fontWeight: 'var(--font-weight-medium)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <Calendar size={14} />
                    {new Date(project.start_date).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>
                    End Date
                  </div>
                  <div style={{ fontWeight: 'var(--font-weight-medium)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <Calendar size={14} />
                    {project.end_date
                      ? new Date(project.end_date).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'Not set'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>
                    Budget
                  </div>
                  <div style={{ fontWeight: 'var(--font-weight-medium)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <Wallet size={14} />
                    PKR 12.5M
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 'var(--space-6)' }}>
                <ProgressBar value={progress} label="Overall Progress" />
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="stats-grid">
            <StatCard
              icon={<ClipboardList size={22} />}
              label="Tasks"
              value="45/60"
              subtitle="Completed"
              color="var(--color-primary)"
            />
            <StatCard
              icon={<MapPin size={22} />}
              label="Site Visits"
              value={12}
              subtitle="This Month"
              color="var(--color-secondary)"
              bgColor="rgba(0, 77, 64, 0.08)"
            />
            <StatCard
              icon={<Users size={22} />}
              label="Labour"
              value={128}
              subtitle="On Site"
              color="var(--color-accent)"
              bgColor="rgba(197, 160, 78, 0.08)"
            />
            <StatCard
              icon={<ShieldAlert size={22} />}
              label="Safety Incidents"
              value="02"
              subtitle="This Month"
              color="var(--color-danger)"
              bgColor="var(--color-danger-bg)"
            />
          </div>

          {/* Sites */}
          {project.sites && project.sites.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)' }}>
                  Project Sites
                </h3>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                <div className="table-container" style={{ border: 'none' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Site Name</th>
                        <th>Location</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {project.sites.map((site) => (
                        <tr key={site.id}>
                          <td style={{ fontWeight: 'var(--font-weight-medium)' }}>{site.name}</td>
                          <td style={{ color: 'var(--color-text-secondary)' }}>{site.location}</td>
                          <td style={{ color: 'var(--color-text-muted)' }}>
                            {new Date(site.created_at).toLocaleDateString('en-GB', {
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
      ) : (
        <div className="coming-soon" style={{ minHeight: '40vh' }}>
          <div className="coming-soon-icon">
            <ClipboardList size={48} />
          </div>
          <h2>{activeTab}</h2>
          <p>
            This section is coming soon. Your team is building this module — stay tuned!
          </p>
        </div>
      )}
    </div>
  );
}
