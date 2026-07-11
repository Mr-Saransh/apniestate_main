import { useState, useEffect, type FormEvent } from 'react';
import { MapPin, Plus, Loader2, Sparkles, User, Hammer, Calendar } from 'lucide-react';
import { apiClient } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { useProject } from '@/context/ProjectContext';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';

interface Site {
  id: string;
  project_id: string;
  name: string;
  location: string;
  supervisor_id?: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED';
  progress_percentage: number;
  phase?: string;
  project?: { name: string };
  supervisor?: { name: string; role: string };
}

interface Project {
  id: string;
  name: string;
}

export default function SitesPage() {
  const { hasPermission } = useAuth();
  const { activeProjectId } = useProject();
  const [sites, setSites] = useState<Site[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [projectId, setProjectId] = useState('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [supervisorId, setSupervisorId] = useState('');
  const [phase, setPhase] = useState('');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'NOT_STARTED' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED'>('IN_PROGRESS');

  useEffect(() => {
    async function loadData() {
      if (!activeProjectId) {
        setSites([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const sitesRes = await apiClient.get<Site[]>(`/sites?project_id=${activeProjectId}`).catch(() => ({ data: [] }));
        const projectsRes = await apiClient.get<Project[]>('/projects').catch(() => ({ data: [] }));
        let usersRes: any = { data: [] };
        if (hasPermission('users.read')) {
          usersRes = await apiClient.get<any[]>('/users').catch(() => ({ data: [] }));
        }
        
        if (sitesRes.data) setSites(sitesRes.data);
        if (projectsRes.data) {
          setProjects(projectsRes.data);
          if (projectsRes.data.length > 0) setProjectId(projectsRes.data[0].id);
        }
        if (usersRes.data) setUsers(usersRes.data);
      } catch (err) {
        console.error('Failed to load sites page data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [activeProjectId]);

  const handleCreateSite = async (e: FormEvent) => {
    e.preventDefault();
    if (!projectId || !name || !location) return;

    setSaving(true);
    try {
      const res = await apiClient.post<Site>('/sites', {
        project_id: projectId,
        name,
        location,
        supervisor_id: supervisorId || null,
        status,
        progress_percentage: Number(progress),
        phase: phase || null
      });

      if (res.data) {
        setSites(prev => [res.data!, ...prev]);
        setShowModal(false);
        // Reset form
        setName('');
        setLocation('');
        setSupervisorId('');
        setPhase('');
        setProgress(0);
        setStatus('IN_PROGRESS');
      }
    } catch (err) {
      console.error('Failed to create site', err);
      alert('Error creating site. Please verify the input.');
    } finally {
      setSaving(false);
    }
  };

  const getStatusLabel = (s: string) => {
    return s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'COMPLETED': return 'var(--color-success)';
      case 'IN_PROGRESS': return 'var(--color-primary)';
      case 'ON_HOLD': return 'var(--color-warning)';
      default: return 'var(--color-text-muted)';
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="animate-fade-in texture-grain" style={{ paddingBottom: 'var(--space-12)' }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={28} color="var(--color-primary)" /> Site Locations
            </h1>
            <p className="page-subtitle">Track and configure all construction sites</p>
          </div>
          <button 
            className="btn btn-primary btn-3d btn-3d-primary animate-pop-in" 
            onClick={() => setShowModal(true)}
            id="btn-add-site"
          >
            <Plus size={18} /> Add Site
          </button>
        </div>
      </div>

      {/* Grid List */}
      {sites.length === 0 ? (
        <EmptyState
          icon={<MapPin size={40} />}
          title="No sites added yet"
          description="Create your first site to track building phases, supervisors, and progress."
        />
      ) : (
        <div className="grid-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-6)' }}>
          {sites.map(site => (
            <div key={site.id} className="card-3d animate-scale-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {/* Top Details */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-bold)', marginBottom: '4px' }}>{site.name}</h3>
                  <span style={{ fontSize: 'var(--font-size-xs)', padding: '2px 8px', borderRadius: '12px', background: 'var(--color-primary-50)', color: 'var(--color-primary)', fontWeight: 'var(--font-weight-medium)' }}>
                    {site.project?.name || 'Apni Estate Project'}
                  </span>
                </div>
                <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: getStatusColor(site.status) }}>
                  ● {getStatusLabel(site.status)}
                </span>
              </div>

              {/* Middle specs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={16} /> <span>{site.location}</span>
                </div>
                {site.phase && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Hammer size={16} /> <span>Phase: {site.phase}</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={16} /> <span>Supervisor: {site.supervisor?.name || 'Unassigned'}</span>
                </div>
              </div>

              {/* Progress */}
              <div style={{ marginTop: 'auto', paddingTop: 'var(--space-2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', marginBottom: '6px' }}>
                  <span>Construction Progress</span>
                  <span>{site.progress_percentage}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${site.progress_percentage}%`, background: getStatusColor(site.status) }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3D Glassmorphic Creation Modal */}
      {showModal && (
        <div className="modal-overlay" style={{ background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', zIndex: 'var(--z-modal)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="panel-glass card-3d animate-pop-in" style={{ width: '90%', maxWidth: '500px', padding: 'var(--space-6)', background: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)' }}>
            <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} color="var(--color-cta)" /> Add New Site Location
            </h2>
            <form onSubmit={handleCreateSite} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              
              <div className="form-group">
                <label className="form-label">Project Association</label>
                <select 
                  className="form-input premium-input"
                  value={projectId}
                  onChange={e => setProjectId(e.target.value)}
                  required
                >
                  <option value="" disabled>Select a project</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Site Identifier / Name</label>
                <input
                  type="text"
                  className="form-input premium-input"
                  placeholder="e.g. Block C Excavation / Tower A Foundation"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Physical Address / Geo Coordinates</label>
                <input
                  type="text"
                  className="form-input premium-input"
                  placeholder="e.g. Sector 62, Noida"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Supervisor</label>
                  <select
                    className="form-input premium-input form-select"
                    value={supervisorId}
                    onChange={e => setSupervisorId(e.target.value)}
                  >
                    <option value="">Select Supervisor...</option>
                    {users
                      .filter(u => ['SITE_SUPERVISOR', 'PROJECT_MANAGER'].includes(u.role))
                      .map(u => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role.replace(/_/g, ' ')})
                        </option>
                      ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Current Phase</label>
                  <input
                    type="text"
                    className="form-input premium-input"
                    placeholder="e.g. Plinth Level"
                    value={phase}
                    onChange={e => setPhase(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-input premium-input"
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                  >
                    <option value="NOT_STARTED">Not Started</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Progress Percentage ({progress}%)</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    className="premium-input"
                    style={{ padding: 0 }}
                    value={progress}
                    onChange={e => setProgress(Number(e.target.value))}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary btn-3d btn-3d-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary btn-3d btn-3d-primary"
                  disabled={saving}
                >
                  {saving ? <Loader2 size={16} className="spinner" /> : 'Create Site'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
