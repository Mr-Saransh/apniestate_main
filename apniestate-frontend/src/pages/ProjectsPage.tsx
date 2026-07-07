import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { projectsApi, type Project, type CreateProjectData } from '@/api/projects';
import { PH, Card, Chip, SrchBar } from '@/components/shared/FigmaComponents';
import { Plus, FolderKanban, Search, MapPin, Calendar, X } from 'lucide-react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

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
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex justify-between items-start">
        <PH title="Projects" sub={`${projects.length} ${projects.length === 1 ? 'project' : 'projects'} total`} />
        <button 
          onClick={() => { resetForm(); setShowCreateModal(true); }}
          className="px-3 py-2 bg-primary text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm hover:bg-primary/90 transition-colors"
        >
          <Plus size={14} /> New Project
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1" onChange={(e: any) => setSearchQuery(e.target.value)}>
          <SrchBar placeholder="Search projects..." />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {statusFilters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase transition-colors ${activeFilter === filter ? 'bg-primary text-white shadow-sm' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm w-full col-span-full">No projects found</div>
        ) : (
          filtered.map((project) => (
            <div 
              key={project.id} 
              onClick={() => navigate(`/projects/${project.id}`)}
              className="bg-card border border-border rounded-xl p-4 shadow-sm cursor-pointer hover:shadow-md hover:border-primary/30 transition-all flex flex-col gap-3 group"
            >
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h3 className="font-bold text-sm text-foreground leading-snug group-hover:text-primary transition-colors">{project.name}</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                    <MapPin size={10} /> {project._count?.sites || 0} Sites • {project.city || 'N/A'}
                  </p>
                </div>
                <Chip color={project.status === 'ACTIVE' ? 'green' : project.status === 'COMPLETED' ? 'gray' : project.status === 'ON_HOLD' ? 'red' : 'yellow'}>
                  {project.status}
                </Chip>
              </div>

              <div className="flex justify-between items-end border-t border-border pt-3 mt-auto">
                 <div>
                   <p className="text-[10px] font-bold text-muted-foreground uppercase">Budget</p>
                   <p className="text-xs font-black text-foreground">₨{(project.budget || 0).toLocaleString()}</p>
                 </div>
                 <div className="text-right">
                   <p className="text-[10px] font-bold text-muted-foreground uppercase">Spent</p>
                   <p className={`text-xs font-black ${(project.actual_cost || 0) > (project.budget || 0) ? 'text-red-500' : 'text-foreground'}`}>
                     ₨{(project.actual_cost || 0).toLocaleString()}
                   </p>
                 </div>
              </div>
              
              <div className="flex flex-col gap-1.5 mt-1">
                 <div className="flex justify-between text-[10px] font-bold">
                   <span className="text-muted-foreground">Progress</span>
                   <span className="text-primary">{project.progress_percentage || 0}%</span>
                 </div>
                 <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                   <div className="h-full bg-primary" style={{ width: `${project.progress_percentage || 0}%` }} />
                 </div>
              </div>
            </div>
          ))
        )}
      </div>


      {/* Create Modal */}
      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-lg rounded-xl border border-border shadow-xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center p-4 border-b border-border">
              <h2 className="font-bold text-foreground">New Project</h2>
              <button onClick={() => { setShowCreateModal(false); resetForm(); }} className="p-1 hover:bg-muted rounded-md transition-colors"><X size={18} className="text-muted-foreground" /></button>
            </div>
            
            <form onSubmit={handleCreate} className="p-4">
              {formError && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs">{formError}</div>}
              
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Project Name *</label>
                  <input type="text" required className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" value={formName} onChange={e => setFormName(e.target.value)} />
                </div>
                
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Description</label>
                  <input type="text" className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" value={formDesc} onChange={e => setFormDesc(e.target.value)} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Start Date *</label>
                    <input type="date" required className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" value={formStartDate} onChange={e => setFormStartDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">End Date</label>
                    <input type="date" className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" value={formEndDate} onChange={e => setFormEndDate(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Budget (₨)</label>
                    <input type="number" className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" value={formBudget} onChange={e => setFormBudget(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</label>
                    <select className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" value={formStatus} onChange={e => setFormStatus(e.target.value as any)}>
                      <option value="PLANNING">Planning</option>
                      <option value="ACTIVE">Active</option>
                      <option value="ON_HOLD">On Hold</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Address</label>
                    <input type="text" className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" value={formAddress} onChange={e => setFormAddress(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">City</label>
                    <input type="text" className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" value={formCity} onChange={e => setFormCity(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-border">
                <button type="button" onClick={() => { setShowCreateModal(false); resetForm(); }} className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={creating} className="px-4 py-2 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2">
                  {creating && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
