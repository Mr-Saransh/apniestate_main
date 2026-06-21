import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsApi, type Project } from '@/api/projects';
import StatusBadge from '@/components/shared/StatusBadge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import {
  ArrowLeft,
  ClipboardList,
  MapPin,
  Users,
  Calendar,
  Wallet,
  ChevronRight,
} from 'lucide-react';

const tabs = ['Overview', 'Sites', 'Tasks', 'Materials', 'Finance'];

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
      {/* Back + Header */}
      <div style={{ marginBottom: 'var(--space-5)' }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate('/projects')}
          style={{ marginBottom: 'var(--space-3)', marginLeft: '-0.5rem' }}
          aria-label="Back to projects"
        >
          <ArrowLeft size={18} />
          Projects
        </button>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <h1 className="page-title" style={{ margin: 0 }}>{project.name}</h1>
              <StatusBadge status={project.status} />
            </div>
            {project.description && (
              <p className="page-subtitle" style={{ marginTop: 'var(--space-2)' }}>
                {project.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 'var(--space-5)' }}>
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
          {/* Project Progress */}
          <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
            <div className="card-body">
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--space-3)',
              }}>
                <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', fontWeight: 'var(--font-weight-medium)' }}>
                  Overall Progress
                </span>
                <span style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-primary)' }}>
                  {progress}%
                </span>
              </div>
              <div className="progress-bar">
                <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid-2" style={{ marginBottom: 'var(--space-5)' }}>
            <InfoCard
              icon={<Calendar size={18} />}
              label="Start Date"
              value={new Date(project.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            />
            <InfoCard
              icon={<Calendar size={18} />}
              label="End Date"
              value={project.end_date
                ? new Date(project.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                : 'Not set'
              }
            />
            <InfoCard icon={<MapPin size={18} />} label="Sites" value={`${project._count?.sites || project.sites?.length || 0} sites`} />
            <InfoCard icon={<Wallet size={18} />} label="Budget" value="PKR 12.5M" />
          </div>

          {/* Stats Row */}
          <div className="grid-2" style={{ marginBottom: 'var(--space-5)' }}>
            <div className="stat-card">
              <div className="stat-card-icon" style={{ background: 'var(--color-primary-50)', color: 'var(--color-primary)' }}>
                <ClipboardList size={20} />
              </div>
              <div className="stat-card-value">45</div>
              <div className="stat-card-label">Total Tasks</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon" style={{ background: 'var(--color-info-bg)', color: 'var(--color-info)' }}>
                <Users size={20} />
              </div>
              <div className="stat-card-value">128</div>
              <div className="stat-card-label">Workers</div>
            </div>
          </div>

          {/* Sites List */}
          {project.sites && project.sites.length > 0 && (
            <div className="section">
              <div className="section-title">Project Sites</div>
              <div className="card" style={{ overflow: 'hidden' }}>
                {project.sites.map((site) => (
                  <div key={site.id} className="list-card" id={`site-${site.id}`}>
                    <div className="list-card-icon" style={{
                      background: 'var(--color-info-bg)',
                      color: 'var(--color-info)',
                    }}>
                      <MapPin size={20} />
                    </div>
                    <div className="list-card-content">
                      <div className="list-card-title">{site.name}</div>
                      <div className="list-card-subtitle">{site.location}</div>
                    </div>
                    <ChevronRight size={18} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="coming-soon" style={{ minHeight: '40vh' }}>
          <div className="coming-soon-icon">
            <ClipboardList size={40} />
          </div>
          <h2>{activeTab}</h2>
          <p>This section is coming soon. Your team is building this module — stay tuned!</p>
        </div>
      )}
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="card">
      <div className="card-body" style={{ padding: 'var(--space-4)' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          color: 'var(--color-text-muted)',
          fontSize: 'var(--font-size-sm)',
          marginBottom: 'var(--space-2)',
        }}>
          {icon}
          {label}
        </div>
        <div style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-base)' }}>
          {value}
        </div>
      </div>
    </div>
  );
}
