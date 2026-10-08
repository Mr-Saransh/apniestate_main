import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  subcontractorsApi,
  type SubContractorAssignment,
} from '@/api/subcontractors';
import { useAuth } from '@/context/AuthContext';
import {
  Briefcase,
  IndianRupee,
  Clock,
  CheckCircle2,
  AlertCircle,
  Receipt,
  ListTodo,
  ArrowRight,
  TrendingUp,
  FolderOpen,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

function fmtINR(val: number | null | undefined): string {
  if (val === null || val === undefined) return '₹0';
  return `₹${val.toLocaleString('en-IN')}`;
}

export default function SubContractorDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [assignments, setAssignments] = useState<SubContractorAssignment[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await subcontractorsApi.getMyAssignments();
        if (res.success && res.data && res.data.length > 0) {
          setAssignments(res.data);
          setSelectedId(res.data[0].id);
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to load your project data');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const activeAssignment = assignments.find((a) => a.id === selectedId) || assignments[0] || null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-2">
          <div className="size-8 border-3 border-[#2648E7] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!activeAssignment) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4">
        <div className="size-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-lg font-bold text-foreground">No Project Assigned Yet</h2>
        <p className="text-xs text-muted-foreground">
          You are logged in as a Sub Contractor, but you have not been assigned to any project yet. Please contact your Builder or Project Manager.
        </p>
      </div>
    );
  }

  const utilPct =
    activeAssignment.allocated_budget > 0
      ? Math.round((activeAssignment.used_budget / activeAssignment.allocated_budget) * 100)
      : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* ─── Header Banner ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              Welcome, {user?.name}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#2648E7]/10 text-[#2648E7] border border-[#2648E7]/20">
              Sub Contractor
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Overview of your project work, budget usage, and pending tasks
          </p>
        </div>

        {/* Multi-project selector if assigned to multiple */}
        {assignments.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground">Project:</span>
            <select
              value={activeAssignment.id}
              onChange={(e) => setSelectedId(e.target.value)}
              className="bg-white border border-border rounded-xl px-3 py-1.5 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-[#2648E7]/20"
            >
              {assignments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.project?.name} ({a.work_type})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ─── Project Assignment & Budget Hero Card ─── */}
      <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-br from-white to-slate-50 border border-border shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
              Assigned Project & Trade
            </span>
            <h2 className="text-2xl font-black text-foreground flex items-center gap-2">
              <FolderOpen size={22} className="text-[#2648E7]" />
              {activeAssignment.project?.name}
            </h2>
            <div className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 bg-white px-3 py-1 rounded-xl border border-border shadow-2xs mt-1">
              <span>Work Type:</span>
              <span className="text-[#2648E7] font-extrabold">{activeAssignment.work_type}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/subcontractor/expenses')}
              className="px-4 py-2.5 rounded-xl bg-[#2648E7] hover:bg-[#1e3bbd] text-white text-xs font-bold inline-flex items-center gap-2 shadow-sm transition-all active:scale-95"
            >
              <Receipt size={14} />
              <span>Submit Expense</span>
            </button>
            <button
              onClick={() => navigate('/subcontractor/tasks')}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-foreground border border-border text-xs font-bold inline-flex items-center gap-2 transition-all active:scale-95 shadow-2xs"
            >
              <ListTodo size={14} />
              <span>My Tasks</span>
            </button>
          </div>
        </div>

        {/* Budget Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-4 rounded-2xl bg-white border border-border shadow-2xs">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Allocated Budget</p>
            <p className="text-xl sm:text-2xl font-black text-foreground mt-1">
              {fmtINR(activeAssignment.allocated_budget)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Approved project allocation</p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 shadow-2xs">
            <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Amount Used</p>
            <p className="text-xl sm:text-2xl font-black text-emerald-700 mt-1">
              {fmtINR(activeAssignment.used_budget)}
            </p>
            <p className="text-[11px] text-emerald-600 mt-0.5">From approved expenses</p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 shadow-2xs">
            <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Remaining Budget</p>
            <p className="text-xl sm:text-2xl font-black text-amber-700 mt-1">
              {fmtINR(activeAssignment.remaining_budget)}
            </p>
            <p className="text-[11px] text-amber-600 mt-0.5">Available for your work</p>
          </div>
        </div>

        {/* Budget Usage Progress Bar */}
        <div className="space-y-1.5 pt-2">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-muted-foreground">Budget Spent</span>
            <span className="text-foreground">{utilPct}% utilized</span>
          </div>
          <div className="w-full bg-slate-200/80 rounded-full h-3 overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all duration-700 ${
                utilPct >= 90 ? 'bg-red-500' : utilPct >= 75 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, utilPct)}%` }}
            />
          </div>
        </div>
      </div>

      {/* ─── Task Metrics Row ─── */}
      <div>
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Task Deliverables</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div
            onClick={() => navigate('/subcontractor/tasks')}
            className="p-4 rounded-2xl bg-white border border-border shadow-xs hover:border-[#2648E7]/40 transition-colors cursor-pointer flex items-center justify-between"
          >
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase">Pending Tasks</p>
              <p className="text-2xl font-black text-blue-700 mt-1">{activeAssignment.pending_tasks_count}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">In progress or open</p>
            </div>
            <div className="size-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock size={20} />
            </div>
          </div>

          <div
            onClick={() => navigate('/subcontractor/tasks')}
            className="p-4 rounded-2xl bg-white border border-border shadow-xs hover:border-[#2648E7]/40 transition-colors cursor-pointer flex items-center justify-between"
          >
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase">Awaiting Builder Approval</p>
              <p className="text-2xl font-black text-purple-700 mt-1">{activeAssignment.completed_awaiting_approval_count}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Submitted for signoff</p>
            </div>
            <div className="size-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Sparkles size={20} />
            </div>
          </div>

          <div
            onClick={() => navigate('/subcontractor/tasks')}
            className="p-4 rounded-2xl bg-white border border-border shadow-xs hover:border-[#2648E7]/40 transition-colors cursor-pointer flex items-center justify-between"
          >
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase">Approved Tasks</p>
              <p className="text-2xl font-black text-emerald-700 mt-1">{activeAssignment.approved_tasks_count}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Fully approved by Builder</p>
            </div>
            <div className="size-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Quick Actions & Tips ─── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-border shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-sm text-foreground">Need to record material or labor expenditure?</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Upload bills directly from your phone camera or gallery to keep your allocated budget records up to date.
          </p>
        </div>
        <button
          onClick={() => navigate('/subcontractor/expenses')}
          className="px-4 py-2 rounded-xl bg-[#2648E7] hover:bg-[#1e3bbd] text-white text-xs font-bold inline-flex items-center gap-1.5 shrink-0 shadow-sm"
        >
          <span>View Expenses</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
