import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { projectsApi, type Project } from '@/api/projects';
import { useProject } from '@/context/ProjectContext';
import { Plus, MapPin, Clock, ChevronRight, X, Building2, Calendar, Target, Activity, Trash2 } from 'lucide-react';

function StatusBadge({ status }: { status: Project["status"] }) {
  const map = {
    ACTIVE: { label: "Active", bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-700", dot: "bg-emerald-500" },
    ON_HOLD: { label: "On Hold", bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-700", dot: "bg-amber-500" },
    COMPLETED: { label: "Completed", bg: "bg-slate-500/10", border: "border-slate-500/20", text: "text-slate-600", dot: "bg-slate-400" },
    PLANNING: { label: "Planning", bg: "bg-[#2648E7]/10", border: "border-[#2648E7]/20", text: "text-[#2648E7]", dot: "bg-[#2648E7]" },
    CANCELLED: { label: "Cancelled", bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-700", dot: "bg-red-500" },
  };
  const s = map[status] || map.PLANNING;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${s.bg} ${s.border} border ${s.text} backdrop-blur-sm shadow-sm transition-all duration-300 hover:shadow-md`}>
      <span className={`size-1.5 rounded-full ${s.dot} animate-pulse`} />
      {s.label}
    </span>
  );
}

function SectionLabel({ children, icon: Icon }: { children: React.ReactNode, icon?: any }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {Icon && <Icon size={16} className="text-[#2648E7]" />}
      <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">{children}</h2>
      <div className="h-px bg-gradient-to-r from-slate-200 to-transparent flex-1 ml-2" />
    </div>
  );
}

function fmt(n: number | null | undefined) {
  if (!n) return '₹0';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n.toLocaleString('en-IN')}`;
}

export default function ProjectsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setActiveProjectId } = useProject();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formStatus, setFormStatus] = useState<Project['status']>('PLANNING');
  const [formBudget, setFormBudget] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formError, setFormError] = useState('');

  const fetchProjects = () => {
    projectsApi.getAll().then(res => {
      if (res.data) setProjects(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('create') === 'true') {
      setShowCreateModal(true);
    }
  }, [location]);

  const resetForm = () => {
    setFormName(''); setFormDesc(''); setFormStartDate(''); setFormEndDate('');
    setFormStatus('PLANNING'); setFormBudget(''); setFormAddress(''); setFormCity('');
    setFormError('');
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    setCreating(true);

    try {
      const data: any = {
        name: formName, description: formDesc || undefined,
        start_date: new Date(formStartDate).toISOString(),
        end_date: formEndDate ? new Date(formEndDate).toISOString() : undefined,
        status: formStatus, budget: formBudget ? parseFloat(formBudget) : undefined,
        address: formAddress || undefined, city: formCity || undefined,
      };
      await projectsApi.create(data);
      setShowCreateModal(false);
      resetForm();
      fetchProjects();
      navigate('/projects');
    } catch (err: any) {
      setFormError(err.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this project? All associated sites, teams, and records will be permanently deleted. This cannot be undone.")) {
      try {
        await projectsApi.delete(id);
        fetchProjects();
      } catch (err: any) {
        alert(err.message || 'Failed to delete project');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50/50">
        <div className="relative flex justify-center items-center">
          <div className="absolute animate-ping w-12 h-12 rounded-full bg-[#2648E7]/20" />
          <div className="w-8 h-8 rounded-full border-4 border-[#2648E7]/20 border-t-[#2648E7] animate-spin relative z-10" />
        </div>
      </div>
    );
  }

  const active = projects.filter((p) => p.status === "ACTIVE" || p.status === "PLANNING");
  const done = projects.filter((p) => p.status !== "ACTIVE" && p.status !== "PLANNING");
  const pendingActions = 0; // Placeholder

  const onSelect = (p: Project) => {
    setActiveProjectId(p.id);
    navigate('/dashboard');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
      {/* Header & Summary */}
      <div className="relative overflow-hidden rounded-[2rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/40 p-6 md:p-8">
        {/* Decorative background blurs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-50/50 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row gap-6 md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              Projects Overview
            </h1>
            <p className="text-slate-500 mt-1 font-medium">Manage your sites and operations</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowCreateModal(true); }}
            className="group relative flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl font-bold text-white shadow-lg shadow-[#2648E7]/30 hover:shadow-xl hover:shadow-[#2648E7]/40 hover:-translate-y-0.5 active:translate-y-0 active:shadow-md transition-all duration-300 overflow-hidden"
            style={{ backgroundImage: "linear-gradient(135deg, #2648E7, #4F6DFF)" }}
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            <Plus size={20} className="relative z-10 group-hover:rotate-90 transition-transform duration-300" />
            <span className="relative z-10">New Project</span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 md:gap-4 relative z-10 mb-8">
          {[
            { label: "Active", value: `${active.length}`, bg: "bg-blue-50/80", text: "text-blue-700", icon: Building2, border: "border-blue-100/50" },
            { label: "Pending", value: `${pendingActions}`, bg: "bg-amber-50/80", text: "text-amber-700", icon: Activity, border: "border-amber-100/50" },
            { label: "Spend", value: fmt(active.reduce((sum, p) => sum + (p.actual_cost || 0), 0)), bg: "bg-emerald-50/80", text: "text-emerald-700", icon: Target, border: "border-emerald-100/50" },
          ].map((s, i) => (
            <div key={s.label} className={`${s.bg} ${s.border} border rounded-xl md:rounded-2xl p-2 md:p-5 flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-1 md:gap-4 transition-transform duration-300 hover:scale-[1.02] cursor-default`}>
              <div className={`w-8 h-8 md:w-12 md:h-12 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0 ${s.text}`}>
                <s.icon className="w-4 h-4 md:w-5 md:h-5" strokeWidth={2.5} />
              </div>
              <div className="flex-1 w-full truncate">
                <p className={`text-base md:text-2xl font-black ${s.text} tracking-tight truncate`}>{s.value}</p>
                <p className="text-[10px] md:text-sm font-semibold text-slate-600/80 mt-0.5 truncate">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Projects */}
      <div>
        <SectionLabel icon={Activity}>Active & Planning</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {active.map((p, i) => {
             const progress = p.progress_percentage || 0;
             return (
               <div
                 key={p.id}
                 onClick={() => onSelect(p)}
                 className="group cursor-pointer text-left w-full bg-white rounded-[1.5rem] p-6 border border-slate-100 shadow-lg shadow-slate-200/30 hover:shadow-xl hover:shadow-[#2648E7]/10 hover:-translate-y-1 transition-all duration-300 ease-out relative overflow-hidden"
                 style={{ animationDelay: `${i * 100}ms` }}
               >
                 <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                 
                 <div className="flex items-start justify-between mb-4 relative z-10">
                   <div className="flex-1 min-w-0 pr-4">
                     <h3 className="font-bold text-slate-900 text-lg leading-tight truncate group-hover:text-[#2648E7] transition-colors duration-300" style={{ fontFamily: "var(--font-display)" }}>
                       {p.name}
                     </h3>
                     <p className="text-sm text-slate-500 mt-1.5 flex items-center gap-1.5 truncate font-medium">
                       <MapPin size={14} className="shrink-0 text-slate-400" />
                       {p.city || p.address || 'No location set'}
                     </p>
                   </div>
                   <StatusBadge status={p.status} />
                 </div>
                 
                 <p className="text-sm text-slate-600 mb-6 line-clamp-2 min-h-[2.5rem] relative z-10">{p.description || <span className="italic opacity-50">No description provided</span>}</p>
                 
                 <div className="relative z-10">
                   <div className="flex justify-between text-xs font-bold text-slate-700 mb-2">
                     <span>Progress</span>
                     <span className="text-[#2648E7]">{progress}%</span>
                   </div>
                   <div className="h-2 rounded-full bg-slate-100 overflow-hidden mb-4 shadow-inner">
                     <div className="h-full rounded-full transition-all duration-1000 ease-out relative" style={{ width: `${progress}%`, backgroundImage: "linear-gradient(90deg, #2648E7, #607CFF)" }}>
                       <div className="absolute top-0 left-0 right-0 bottom-0 bg-white/20 animate-pulse" />
                     </div>
                   </div>
                 </div>

                 <div className="flex items-center justify-between text-sm pt-4 border-t border-slate-100 relative z-10">
                   <div className="flex flex-col gap-1 text-slate-500 font-medium">
                     {p.end_date ? (
                       <span className="flex items-center gap-1.5"><Calendar size={13} className="text-[#2648E7]" />
                         Due {new Date(p.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                       </span>
                     ) : (
                       <span className="flex items-center gap-1.5 opacity-50"><Calendar size={13} />No deadline</span>
                     )}
                     <span className="text-xs">Budget: <span className="text-slate-800 font-bold">{fmt(p.actual_cost)}</span> / {fmt(p.budget)}</span>
                   </div>
                   <div className="flex gap-2">
                     <button onClick={(e) => handleDelete(e, p.id)} className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center group-hover:bg-red-500 transition-colors duration-300 shadow-sm relative z-20">
                       <Trash2 size={16} className="text-red-400 group-hover:text-white transition-colors duration-300" />
                     </button>
                     <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-[#2648E7] transition-colors duration-300 shadow-sm">
                       <ChevronRight size={18} className="text-slate-400 group-hover:text-white transition-colors duration-300" />
                     </div>
                   </div>
                 </div>
               </div>
             );
          })}
          {active.length === 0 && (
            <div className="col-span-full p-12 text-center flex flex-col items-center justify-center bg-gradient-to-b from-white to-slate-50/50 rounded-[2rem] border-2 border-slate-200 border-dashed shadow-sm">
              <div className="w-20 h-20 bg-white rounded-[1.5rem] shadow-sm flex items-center justify-center mb-5 rotate-3 hover:rotate-0 transition-transform duration-300">
                <Building2 size={32} className="text-[#2648E7]" />
              </div>
              <h3 className="font-black text-slate-800 text-xl mb-2" style={{ fontFamily: "var(--font-display)" }}>No Active Projects</h3>
              <p className="text-slate-500 text-sm max-w-sm font-medium">You don't have any projects in progress. Create a new one to get started.</p>
              
              <button
                onClick={() => { resetForm(); setShowCreateModal(true); }}
                className="mt-6 px-6 py-3 rounded-2xl font-bold text-white shadow-lg shadow-[#2648E7]/30 hover:shadow-xl hover:shadow-[#2648E7]/40 hover:-translate-y-0.5 transition-all duration-300"
                style={{ backgroundImage: "linear-gradient(135deg, #2648E7, #4F6DFF)" }}
              >
                Create Project
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Completed Projects */}
      {done.length > 0 && (
        <div className="mt-8">
          <SectionLabel>Completed Projects</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {done.map((p) => (
              <button
                key={p.id}
                onClick={() => onSelect(p)}
                className="group w-full bg-white rounded-2xl px-5 py-4 shadow-sm border border-slate-100 text-left hover:shadow-md hover:border-slate-200 transition-all duration-300 flex items-center justify-between"
              >
                <div className="min-w-0 pr-3">
                  <p className="font-bold text-slate-800 truncate group-hover:text-[#2648E7] transition-colors">{p.name}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1 truncate font-medium">
                     <MapPin size={12} className="shrink-0" />{p.city || p.address || 'No location set'}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0 relative z-20">
                  <StatusBadge status={p.status} />
                  <button onClick={(e) => handleDelete(e, p.id)} className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-slate-100 transition-colors">
                    <ChevronRight size={14} className="text-slate-400" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl shadow-black/20 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
            <div className="sticky top-0 z-10 flex justify-between items-center p-6 bg-white/80 backdrop-blur-xl border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-[1rem] bg-gradient-to-br from-[#2648E7]/10 to-[#2648E7]/5 flex items-center justify-center text-[#2648E7] shadow-inner">
                  <Building2 size={24} />
                </div>
                <div>
                  <h2 className="font-black text-slate-900 text-2xl tracking-tight" style={{ fontFamily: "var(--font-display)" }}>Create New Project</h2>
                  <p className="text-sm font-medium text-slate-500 mt-0.5">Fill in the details to start a new site.</p>
                </div>
              </div>
              <button onClick={() => { setShowCreateModal(false); resetForm(); navigate('/projects'); }} className="p-2.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-700 bg-slate-50">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 md:p-8">
              {formError && <div className="p-4 mb-6 bg-red-50/80 border border-red-100 text-red-600 rounded-2xl text-sm font-semibold flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-500" />{formError}</div>}
              
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 mb-2 block">Project Name <span className="text-red-500">*</span></label>
                  <input type="text" required placeholder="e.g. Hari Nagar Villa" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-[#2648E7]/10 focus:border-[#2648E7] transition-all placeholder:text-slate-400 shadow-sm" value={formName} onChange={e => setFormName(e.target.value)} />
                </div>
                
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 mb-2 block">Description</label>
                  <textarea placeholder="Brief description of the project..." rows={3} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-[#2648E7]/10 focus:border-[#2648E7] transition-all placeholder:text-slate-400 shadow-sm resize-none" value={formDesc} onChange={e => setFormDesc(e.target.value)} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 mb-2 block">Start Date <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input type="date" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-[#2648E7]/10 focus:border-[#2648E7] transition-all shadow-sm" value={formStartDate} onChange={e => setFormStartDate(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 mb-2 block">End Date (Est.)</label>
                    <input type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-[#2648E7]/10 focus:border-[#2648E7] transition-all shadow-sm" value={formEndDate} onChange={e => setFormEndDate(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 mb-2 block">Budget (₹)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                      <input type="number" placeholder="0.00" className="w-full p-4 pl-8 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-[#2648E7]/10 focus:border-[#2648E7] transition-all shadow-sm" value={formBudget} onChange={e => setFormBudget(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 mb-2 block">Status</label>
                    <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-[#2648E7]/10 focus:border-[#2648E7] transition-all shadow-sm appearance-none cursor-pointer" value={formStatus} onChange={e => setFormStatus(e.target.value as any)}>
                      <option value="PLANNING">Planning</option>
                      <option value="ACTIVE">Active</option>
                      <option value="ON_HOLD">On Hold</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 mb-2 block">Address</label>
                    <input type="text" placeholder="Street address..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-[#2648E7]/10 focus:border-[#2648E7] transition-all shadow-sm" value={formAddress} onChange={e => setFormAddress(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 mb-2 block">City</label>
                    <input type="text" placeholder="e.g. New Delhi" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-[#2648E7]/10 focus:border-[#2648E7] transition-all shadow-sm" value={formCity} onChange={e => setFormCity(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-4 pt-6 border-t border-slate-100">
                <button type="button" onClick={() => { setShowCreateModal(false); resetForm(); navigate('/projects'); }} className="flex-1 py-4 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all duration-300">Cancel</button>
                <button type="submit" disabled={creating} className="flex-[2] py-4 text-sm font-bold text-white rounded-2xl shadow-lg shadow-[#2648E7]/30 hover:shadow-xl hover:shadow-[#2648E7]/40 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-2" style={{ backgroundImage: "linear-gradient(135deg, #2648E7, #4F6DFF)" }}>
                  {creating ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus size={18} />}
                  {creating ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
