import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { projectsApi, type Project, type CreateProjectData } from '@/api/projects';
import StatusBadge from '@/components/shared/StatusBadge';
import Modal from '@/components/shared/Modal';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import { Plus, FolderKanban, Search, MapPin, Calendar } from 'lucide-react';

const statusFilters = ['All', 'Active', 'Planning', 'On Hold', 'Completed'];

export default function ProjectsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formStatus, setFormStatus] = useState<Project['status']>('PLANNING');
  const [formBudget, setFormBudget] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('create') === 'true') {
      setShowCreateModal(true);
    }
  }, [location]);

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
      const data: any = {
        name: formName,
        description: formDesc || undefined,
        start_date: new Date(formStartDate).toISOString(),
        end_date: formEndDate ? new Date(formEndDate).toISOString() : undefined,
        status: formStatus,
        budget: formBudget ? parseFloat(formBudget) : undefined,
        address: formAddress || undefined,
        city: formCity || undefined,
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
    setFormBudget('');
    setFormAddress('');
    setFormCity('');
    setFormError('');
  };

  const filtered = projects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'All' ||
      p.status === activeFilter.toUpperCase().replace(' ', '_');
    return matchesSearch && matchesFilter;
  });

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 className="page-title">Projects</h1>
            <p className="page-subtitle">
              {projects.length} {projects.length === 1 ? 'project' : 'projects'} total
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowCreateModal(true); }} id="btn-add-project">
            <Plus size={18} /> Add Project
          </button>
        </div>
      </div>

      {/* Search */}
      {projects.length > 0 && (
        <div style={{ marginBottom: 'var(--space-4)' }}>
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

      {/* Filter Chips */}
      {projects.length > 0 && (
        <div className="filter-bar" style={{ marginBottom: 'var(--space-5)' }}>
          {statusFilters.map((filter) => (
            <button
              key={filter}
              className={`filter-chip ${activeFilter === filter ? 'active' : ''}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      )}

      {/* Projects List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<FolderKanban size={36} />}
          title={searchQuery || activeFilter !== 'All' ? 'No projects found' : 'No projects yet'}
          description={
            searchQuery || activeFilter !== 'All'
              ? 'Try adjusting your search or filter'
              : 'Create your first project to get started'
          }
          action={
            !searchQuery && activeFilter === 'All' ? (
              <button
                className="btn btn-cta"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus size={18} />
                Create Project
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          {filtered.map((project, idx) => (
            <div
              key={project.id}
              className="list-card"
              onClick={() => navigate(`/projects/${project.id}`)}
              id={`project-${idx}`}
            >
              <div
                className="list-card-icon"
                style={{
                  background: getProjectColor(project.status).bg,
                  color: getProjectColor(project.status).color,
                }}
              >
                <FolderKanban size={20} />
              </div>
              <div className="list-card-content">
                <div className="list-card-title">{project.name}</div>
                <div className="list-card-subtitle">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={12} /> {project._count?.sites || 0} sites
                  </span>
                  <span style={{ margin: '0 6px', opacity: 0.4 }}>·</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={12} /> {formatDate(project.start_date)}
                  </span>
                </div>
              </div>
              <div className="list-card-meta">
                <StatusBadge status={project.status} />
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
        title="New Project"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => { setShowCreateModal(false); resetForm(); }}>
              Cancel
            </button>
            <button
              className="btn btn-cta"
              onClick={handleCreate as any}
              disabled={creating || !formName || !formStartDate}
              id="submit-create-project"
            >
              {creating ? 'Creating...' : 'Create Project'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
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
              placeholder="e.g., Green Valley Residency"
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
              style={{ resize: 'vertical', minHeight: '80px' }}
            />
          </div>
          <div className="grid-2">
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="project-budget">Project Budget (₹)</label>
              <input
                id="project-budget"
                type="number"
                className="form-input"
                placeholder="e.g. 5000000"
                value={formBudget}
                onChange={(e) => setFormBudget(e.target.value)}
              />
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
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="project-address">Site Address</label>
              <input
                id="project-address"
                type="text"
                className="form-input"
                placeholder="e.g., 123 Construction St"
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="project-city">City</label>
              <input
                id="project-city"
                type="text"
                className="form-input"
                placeholder="e.g., Noida"
                value={formCity}
                onChange={(e) => setFormCity(e.target.value)}
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function getProjectColor(status: string) {
  switch (status) {
    case 'ACTIVE':
      return { color: 'var(--color-success)', bg: 'var(--color-success-bg)' };
    case 'ON_HOLD':
      return { color: 'var(--color-warning)', bg: 'var(--color-warning-bg)' };
    case 'COMPLETED':
      return { color: '#166534', bg: '#F0FDF4' };
    case 'CANCELLED':
      return { color: 'var(--color-danger)', bg: 'var(--color-danger-bg)' };
    default:
      return { color: 'var(--color-primary)', bg: 'var(--color-primary-50)' };
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
