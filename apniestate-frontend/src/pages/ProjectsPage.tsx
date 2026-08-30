import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { projectsApi, type Project } from '@/api/projects';
import { subscriptionApi, type CompanyEntitlements } from '@/api/subscription';
import { useProject } from '@/context/ProjectContext';
import {
  Plus,
  MapPin,
  Clock,
  ChevronRight,
  X,
  Building2,
  Calendar,
  Target,
  Activity,
  Trash2,
  Zap,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Pencil,
  Check,
  Loader2,
} from 'lucide-react';

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

function SectionLabel({ children, icon: Icon }: { children: React.ReactNode; icon?: any }) {
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
  const { setActiveProjectId, refreshProjects } = useProject();
  const [projects, setProjects] = useState<Project[]>([]);
  const [entitlements, setEntitlements] = useState<CompanyEntitlements | null>(null);
  const [loading, setLoading] = useState(true);

  // Create Project State
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

  // Edit Project State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editStatus, setEditStatus] = useState<Project['status']>('PLANNING');
  const [editBudget, setEditBudget] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editError, setEditError] = useState('');

  const fetchProjects = () => {
    projectsApi
      .getAll()
      .then((res) => {
        if (res.data) setProjects(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    subscriptionApi
      .getEntitlements()
      .then((res) => {
        if (res.success && res.data) {
          setEntitlements(res.data);
        }
      })
      .catch(() => {});
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

  const openEditModal = (p: Project, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingProject(p);
    setEditName(p.name || '');
    setEditDesc(p.description || '');
    setEditStartDate(p.start_date ? p.start_date.split('T')[0] : '');
    setEditEndDate(p.end_date ? p.end_date.split('T')[0] : '');
    setEditStatus(p.status || 'PLANNING');
    setEditBudget(p.budget ? String(p.budget) : '');
    setEditAddress(p.address || '');
    setEditCity(p.city || '');
    setEditError('');
    setShowEditModal(true);
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    setCreating(true);

    try {
      const data: any = {
        name: formName.trim(),
        description: formDesc ? formDesc.trim() : undefined,
        start_date: new Date(formStartDate).toISOString(),
        end_date: formEndDate ? new Date(formEndDate).toISOString() : undefined,
        status: formStatus,
        budget: formBudget ? parseFloat(formBudget) : undefined,
        address: formAddress ? formAddress.trim() : undefined,
        city: formCity ? formCity.trim() : undefined,
      };
      const newProjectRes = await projectsApi.create(data);
      setShowCreateModal(false);
      resetForm();
      fetchProjects();
      await refreshProjects();
      if (newProjectRes.data) setActiveProjectId(newProjectRes.data.id);
      navigate('/dashboard');
    } catch (err: any) {
      setFormError(err.message || 'Failed to create project. Limit reached on current plan.');
    } finally {
      setCreating(false);
    }
  };

  const handleSaveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    setEditError('');
    setIsSavingEdit(true);

    try {
      const updateData: any = {
        name: editName.trim(),
        description: editDesc ? editDesc.trim() : null,
        start_date: editStartDate ? new Date(editStartDate).toISOString() : undefined,
        end_date: editEndDate ? new Date(editEndDate).toISOString() : null,
        status: editStatus,
        budget: editBudget ? parseFloat(editBudget) : null,
        address: editAddress ? editAddress.trim() : null,
        city: editCity ? editCity.trim() : null,
      };

      await projectsApi.update(editingProject.id, updateData);
      setShowEditModal(false);
      setEditingProject(null);
      fetchProjects();
      await refreshProjects();
    } catch (err: any) {
      setEditError(err.message || 'Failed to update project.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (
      confirm(
        'Are you sure you want to delete this project? All associated sites, teams, and records will be permanently deleted.'
      )
    ) {
      try {
        await projectsApi.delete(id);
        fetchProjects();
        await refreshProjects();
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

  const active = projects.filter((p) => p.status === 'ACTIVE' || p.status === 'PLANNING' || p.status === 'ON_HOLD');
  const done = projects.filter((p) => p.status === 'COMPLETED' || p.status === 'CANCELLED');
  const pendingActions = 0;

  const onSelect = (p: Project) => {
    setActiveProjectId(p.id);
    navigate('/dashboard');
  };

  const isLimitReached = entitlements ? !entitlements.can_create_project : false;

  return (
    <div className="max-w-3xl mt-5 mx-auto space-y-8 pb-12 px-4 lg:px-0 animate-in fade-in duration-500">
      {/* Plan limit warning banner */}
      {isLimitReached && entitlements && (
        <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900">
                Active Project Quota Reached ({entitlements.active_projects_count}/{entitlements.max_projects})
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Your {entitlements.plan_name} allows up to {entitlements.max_projects} active project(s). Upgrade to create more sites.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/subscription')}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#2648E7] text-white hover:bg-[#1e3bbd] shadow-md transition-all flex items-center gap-1.5 shrink-0"
          >
            <Sparkles size={14} className="text-[#FCC300]" />
            <span>Upgrade Plan</span>
          </button>
        </div>
      )}

      {/* Header & Summary */}
      <div className="relative overflow-hidden rounded-[2rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/40 p-6 md:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-50/50 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row gap-6 md:items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                Projects Overview
              </h1>
              {entitlements && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {entitlements.badge || entitlements.plan_name}
                </span>
              )}
            </div>
            <p className="text-slate-500 font-medium">Manage your sites, operations, and construction progress</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="group relative flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl font-bold text-white shadow-lg shadow-[#2648E7]/30 hover:shadow-xl hover:shadow-[#2648E7]/40 hover:-translate-y-0.5 active:translate-y-0 active:shadow-md transition-all duration-300 overflow-hidden"
            style={{ backgroundImage: 'linear-gradient(135deg, #2648E7, #4F6DFF)' }}
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            <Plus size={20} className="relative z-10 group-hover:rotate-90 transition-transform duration-300" />
            <span className="relative z-10">New Project</span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 md:gap-4 relative z-10 mb-2">
          {[
            {
              label: 'Active Quota',
              value: entitlements ? `${active.length} / ${entitlements.max_projects === -1 ? '∞' : entitlements.max_projects}` : `${active.length}`,
              bg: 'bg-blue-50/80',
              text: 'text-blue-700',
              icon: Building2,
              border: 'border-blue-100/50',
            },
            {
              label: 'Completed',
              value: `${done.length}`,
              bg: 'bg-amber-50/80',
              text: 'text-amber-700',
              icon: Activity,
              border: 'border-amber-100/50',
            },
            {
              label: 'Spend',
              value: fmt(active.reduce((sum, p) => sum + (p.actual_cost || 0), 0)),
              bg: 'bg-emerald-50/80',
              text: 'text-emerald-700',
              icon: Target,
              border: 'border-emerald-100/50',
            },
          ].map((s) => (
            <div
              key={s.label}
              className={`${s.bg} ${s.border} border rounded-xl md:rounded-2xl p-2 md:p-5 flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-1 md:gap-4 transition-transform duration-300 hover:scale-[1.02] cursor-default`}
            >
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
        <SectionLabel icon={Activity}>Active & Planning ({active.length})</SectionLabel>
        {active.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-100 shadow-sm text-slate-500 font-medium">
            No active projects currently. Click "New Project" to start one.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {active.map((p, i) => {
              const progress = p.progress_percentage || 0;
              return (
                <div
                  key={p.id}
                  onClick={() => onSelect(p)}
                  className="group cursor-pointer text-left w-full bg-white rounded-[1.5rem] p-6 border border-slate-100 shadow-lg shadow-slate-200/30 hover:shadow-xl hover:shadow-[#2648E7]/10 hover:-translate-y-1 transition-all duration-300 ease-out relative overflow-hidden flex flex-col justify-between"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3 relative z-10">
                      <div className="flex-1 min-w-0">
                        <h3
                          className="font-bold text-slate-900 text-lg leading-tight truncate group-hover:text-[#2648E7] transition-colors duration-300"
                          style={{ fontFamily: 'var(--font-display)' }}
                        >
                          {p.name}
                        </h3>
                        <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5 truncate font-medium">
                          <MapPin size={14} className="shrink-0 text-slate-400" />
                          {p.city || p.address || 'No location set'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <StatusBadge status={p.status} />
                        <button
                          type="button"
                          onClick={(e) => openEditModal(p, e)}
                          className="p-2 rounded-xl bg-slate-50 hover:bg-[#2648E7]/10 text-slate-500 hover:text-[#2648E7] border border-slate-100 transition-all shadow-sm"
                          title="Edit Project Details"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, p.id)}
                          className="p-2 rounded-xl bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 border border-slate-100 transition-all shadow-sm"
                          title="Delete Project"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <p className="text-sm text-slate-600 mb-4 line-clamp-2 min-h-[2.5rem] relative z-10">
                      {p.description || <span className="italic opacity-50">No description provided</span>}
                    </p>

                    {/* Meta info: Budget and Dates */}
                    <div className="grid grid-cols-2 gap-2 mb-4 p-3 rounded-xl bg-slate-50/80 border border-slate-100 relative z-10 text-xs">
                      <div>
                        <span className="text-slate-400 block font-semibold text-[10px] uppercase">Budget</span>
                        <span className="font-bold text-slate-800">{fmt(p.budget)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold text-[10px] uppercase">Start Date</span>
                        <span className="font-bold text-slate-800">
                          {p.start_date ? new Date(p.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not set'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10 mt-auto">
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
                      <span>Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#2648E7] to-[#4F6DFF] rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Done Projects */}
      {done.length > 0 && (
        <div>
          <SectionLabel icon={Building2}>Completed & Archived ({done.length})</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {done.map((p) => (
              <div
                key={p.id}
                onClick={() => onSelect(p)}
                className="bg-white/70 p-5 rounded-2xl border border-slate-200/60 flex items-center justify-between cursor-pointer hover:bg-white transition-all shadow-sm group"
              >
                <div className="flex-1 min-w-0 pr-3">
                  <h4 className="font-bold text-slate-800 text-sm group-hover:text-[#2648E7] transition-colors truncate">{p.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{p.city || p.address || 'Completed site'}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={p.status} />
                  <button
                    type="button"
                    onClick={(e) => openEditModal(p, e)}
                    className="p-1.5 rounded-lg bg-slate-50 hover:bg-[#2648E7]/10 text-slate-500 hover:text-[#2648E7] transition-colors"
                    title="Edit Project"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, p.id)}
                    className="p-1.5 rounded-lg bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                    title="Delete Project"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Modal with Entitlement Guard */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl shadow-black/20 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
            <div className="sticky top-0 z-10 flex justify-between items-center p-6 bg-white/80 backdrop-blur-xl border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-[1rem] bg-gradient-to-br from-[#2648E7]/10 to-[#2648E7]/5 flex items-center justify-center text-[#2648E7] shadow-inner">
                  <Building2 size={24} />
                </div>
                <div>
                  <h2 className="font-black text-slate-900 text-2xl tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                    Create New Project
                  </h2>
                  <p className="text-sm font-medium text-slate-500 mt-0.5">Fill in the details to start a new site.</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                  navigate('/projects');
                }}
                className="p-2.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-700 bg-slate-50"
              >
                <X size={20} />
              </button>
            </div>

            {/* Quota Barrier inside modal */}
            {isLimitReached && entitlements ? (
              <div className="p-8 text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center mx-auto">
                  <ShieldAlert size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Project Limit Reached</h3>
                  <p className="text-sm text-slate-600 max-w-md mx-auto mt-2">
                    Your current <strong>{entitlements.plan_name}</strong> allows up to <strong>{entitlements.max_projects} active project(s)</strong>.
                    You currently have {entitlements.active_projects_count} active projects.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 max-w-md mx-auto text-left text-xs text-slate-600 space-y-2">
                  <p className="font-bold text-slate-800">To create additional projects:</p>
                  <p>• Upgrade to <strong>Growth (₹50K)</strong> for 3 projects or <strong>Enterprise (₹1L)</strong> for unlimited projects.</p>
                  <p>• Or mark an existing completed project as "COMPLETED" / "CANCELLED" to free up an active slot.</p>
                </div>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      navigate('/subscription');
                    }}
                    className="px-6 py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-[#2648E7] to-[#4F6DFF] text-white shadow-lg shadow-[#2648E7]/30 hover:scale-105 transition-all flex items-center gap-2"
                  >
                    <Sparkles size={16} className="text-[#FCC300]" />
                    <span>Upgrade Subscription</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      navigate('/projects');
                    }}
                    className="px-6 py-3.5 rounded-2xl font-bold text-sm bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreate} className="p-6 md:p-8">
                {formError && (
                  <div className="p-4 mb-6 bg-red-50/80 border border-red-100 text-red-600 rounded-2xl text-sm font-semibold flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    {formError}
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 mb-2 block">
                      Project Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Hari Nagar Villa"
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-[#2648E7]/10 focus:border-[#2648E7] transition-all placeholder:text-slate-400 shadow-sm"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 mb-2 block">Description</label>
                    <textarea
                      placeholder="Brief description of the project..."
                      rows={3}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-[#2648E7]/10 focus:border-[#2648E7] transition-all placeholder:text-slate-400 shadow-sm resize-none"
                      value={formDesc}
                      onChange={(e) => setFormDesc(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 mb-2 block">
                        Start Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-[#2648E7]/10 focus:border-[#2648E7] transition-all shadow-sm"
                        value={formStartDate}
                        onChange={(e) => setFormStartDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 mb-2 block">End Date (Est.)</label>
                      <input
                        type="date"
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-[#2648E7]/10 focus:border-[#2648E7] transition-all shadow-sm"
                        value={formEndDate}
                        onChange={(e) => setFormEndDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 mb-2 block">Budget (₹)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                        <input
                          type="number"
                          placeholder="0.00"
                          className="w-full p-4 pl-8 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-[#2648E7]/10 focus:border-[#2648E7] transition-all shadow-sm"
                          value={formBudget}
                          onChange={(e) => setFormBudget(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 mb-2 block">Status</label>
                      <select
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-[#2648E7]/10 focus:border-[#2648E7] transition-all shadow-sm appearance-none cursor-pointer"
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value as any)}
                      >
                        <option value="PLANNING">Planning</option>
                        <option value="ACTIVE">Active</option>
                        <option value="ON_HOLD">On Hold</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 mb-2 block">Address</label>
                      <input
                        type="text"
                        placeholder="Street address..."
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-[#2648E7]/10 focus:border-[#2648E7] transition-all shadow-sm"
                        value={formAddress}
                        onChange={(e) => setFormAddress(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 mb-2 block">City</label>
                      <input
                        type="text"
                        placeholder="e.g. New Delhi"
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-[#2648E7]/10 focus:border-[#2648E7] transition-all shadow-sm"
                        value={formCity}
                        onChange={(e) => setFormCity(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex gap-4 pt-6 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                      navigate('/projects');
                    }}
                    className="flex-1 py-4 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-[2] py-4 text-sm font-bold text-white rounded-2xl shadow-lg shadow-[#2648E7]/30 hover:shadow-xl hover:shadow-[#2648E7]/40 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                    style={{ backgroundImage: 'linear-gradient(135deg, #2648E7, #4F6DFF)' }}
                  >
                    {creating ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Plus size={18} />
                    )}
                    {creating ? 'Creating...' : 'Create Project'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {showEditModal && editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl shadow-black/20 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
            <div className="sticky top-0 z-10 flex justify-between items-center p-6 bg-white/80 backdrop-blur-xl border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-[1rem] bg-gradient-to-br from-[#2648E7]/10 to-[#2648E7]/5 flex items-center justify-center text-[#2648E7] shadow-inner">
                  <Pencil size={22} />
                </div>
                <div>
                  <h2 className="font-black text-slate-900 text-2xl tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                    Edit Project
                  </h2>
                  <p className="text-sm font-medium text-slate-500 mt-0.5">Update project name, dates, status, budget, and location.</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingProject(null);
                }}
                className="p-2.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-700 bg-slate-50"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 md:p-8">
              {editError && (
                <div className="p-4 mb-6 bg-red-50/80 border border-red-100 text-red-600 rounded-2xl text-sm font-semibold flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  {editError}
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 mb-2 block">
                    Project Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hari Nagar Villa"
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-[#2648E7]/10 focus:border-[#2648E7] transition-all placeholder:text-slate-400 shadow-sm"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 mb-2 block">Description</label>
                  <textarea
                    placeholder="Brief description of the project..."
                    rows={3}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-[#2648E7]/10 focus:border-[#2648E7] transition-all placeholder:text-slate-400 shadow-sm resize-none"
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 mb-2 block">
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-[#2648E7]/10 focus:border-[#2648E7] transition-all shadow-sm"
                      value={editStartDate}
                      onChange={(e) => setEditStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 mb-2 block">End Date (Est.)</label>
                    <input
                      type="date"
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-[#2648E7]/10 focus:border-[#2648E7] transition-all shadow-sm"
                      value={editEndDate}
                      onChange={(e) => setEditEndDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 mb-2 block">Budget (₹)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        className="w-full p-4 pl-8 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-[#2648E7]/10 focus:border-[#2648E7] transition-all shadow-sm"
                        value={editBudget}
                        onChange={(e) => setEditBudget(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 mb-2 block">Status</label>
                    <select
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-[#2648E7]/10 focus:border-[#2648E7] transition-all shadow-sm appearance-none cursor-pointer"
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as any)}
                    >
                      <option value="PLANNING">Planning</option>
                      <option value="ACTIVE">Active</option>
                      <option value="ON_HOLD">On Hold</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 mb-2 block">Address</label>
                    <input
                      type="text"
                      placeholder="Street address..."
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-[#2648E7]/10 focus:border-[#2648E7] transition-all shadow-sm"
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 mb-2 block">City</label>
                    <input
                      type="text"
                      placeholder="e.g. New Delhi"
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-[#2648E7]/10 focus:border-[#2648E7] transition-all shadow-sm"
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-4 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingProject(null);
                  }}
                  className="flex-1 py-4 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="flex-[2] py-4 text-sm font-bold text-white rounded-2xl shadow-lg shadow-[#2648E7]/30 hover:shadow-xl hover:shadow-[#2648E7]/40 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                  style={{ backgroundImage: 'linear-gradient(135deg, #2648E7, #4F6DFF)' }}
                >
                  {isSavingEdit ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Check size={18} />
                      <span>Save Project</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
