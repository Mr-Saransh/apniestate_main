import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsApi, type Project, type CreateProjectData } from '@/api/projects';
import StatusBadge from '@/components/shared/StatusBadge';
import Modal from '@/components/shared/Modal';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import { Plus, FolderKanban, Search, MapPin, Calendar } from 'lucide-react';

export default function ProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formStatus, setFormStatus] = useState<Project['status']>('PLANNING');
  const [formError, setFormError] = useState('');

  const fetchProjects = async () => {
    try {
      const res = await projectsApi.getAll();
      if (res.data) setProjects(res.data);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    setCreating(true);

    try {
      const data: CreateProjectData = {
        name: formName,
        description: formDesc || undefined,
        start_date: new Date(formStartDate).toISOString(),
        end_date: formEndDate ? new Date(formEndDate).toISOString() : undefined,
        status: formStatus,
      };
      await projectsApi.create(data);
      setShowCreateModal(false);
      resetForm();
      fetchProjects();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormDesc('');
    setFormStartDate('');
    setFormEndDate('');
    setFormStatus('PLANNING');
    setFormError('');
  };

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">
            Manage and track all your construction projects
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
          id="create-project-btn"
        >
          <Plus size={18} />
          New Project
        </button>
      </div>

      {/* Search Bar */}
      {projects.length > 0 && (
        <div style={{ marginBottom: 'var(--space-5)', maxWidth: 400 }}>
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="form-input"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="search-projects"
            />
          </div>
        </div>
      )}

      {/* Projects Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<FolderKanban size={36} />}
          title={searchQuery ? 'No projects found' : 'No projects yet'}
          description={
            searchQuery
              ? 'Try adjusting your search terms'
              : 'Create your first project to get started'
          }
          action={
            !searchQuery ? (
              <button
                className="btn btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus size={18} />
                Create Project
              </button>
            ) : undefined
          }
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: 'var(--space-5)',
          }}
        >
          {filtered.map((project) => (
            <div
              key={project.id}
              className="card"
              onClick={() => navigate(`/projects/${project.id}`)}
              style={{ cursor: 'pointer' }}
            >
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                  <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)' }}>
                    {project.name}
                  </h3>
                  <StatusBadge status={project.status} />
                </div>

                {project.description && (
                  <p style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-secondary)',
                    marginBottom: 'var(--space-4)',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {project.description}
                  </p>
                )}

                <div style={{ display: 'flex', gap: 'var(--space-5)', marginTop: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                    <MapPin size={14} />
                    <span>{project._count?.sites || 0} sites</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                    <Calendar size={14} />
                    <span>
                      {new Date(project.start_date).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Create New Project"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => { setShowCreateModal(false); resetForm(); }}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleCreate as any}
              disabled={creating || !formName || !formStartDate}
              id="submit-create-project"
            >
              {creating ? 'Creating...' : 'Create Project'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {formError && (
            <div className="login-error">
              <span>{formError}</span>
            </div>
          )}
          <div className="form-group">
            <label className="form-label" htmlFor="project-name">Project Name *</label>
            <input
              id="project-name"
              type="text"
              className="form-input"
              placeholder="Enter project name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="project-desc">Description</label>
            <textarea
              id="project-desc"
              className="form-input"
              placeholder="Brief project description"
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="project-start">Start Date *</label>
              <input
                id="project-start"
                type="date"
                className="form-input"
                value={formStartDate}
                onChange={(e) => setFormStartDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="project-end">End Date</label>
              <input
                id="project-end"
                type="date"
                className="form-input"
                value={formEndDate}
                onChange={(e) => setFormEndDate(e.target.value)}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="project-status">Status</label>
            <select
              id="project-status"
              className="form-input form-select"
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value as Project['status'])}
            >
              <option value="PLANNING">Planning</option>
              <option value="ACTIVE">Active</option>
              <option value="ON_HOLD">On Hold</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
}
