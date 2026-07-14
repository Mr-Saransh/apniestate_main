import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '@/context/ProjectContext';
import { apiClient } from '@/api/client';
import {
  Users, IndianRupee, Package, CloudSun,
  ChevronRight, Calendar, TrendingUp, ShoppingCart, Wallet, HardHat
} from 'lucide-react';

interface ProjectSummary {
  project: {
    id: string; name: string; status: string; budget: number | null;
    actual_cost: number | null; start_date: string; end_date: string | null;
    progress_percentage: number; manager: string; supervisor: string; sitesCount: number; activeSitesCount: number;
  };
  todaySummary: {
    labourCount: number; labourCost: number; todayExpense: number;
    pendingMaterialRequests: number; pendingVendorPayments: number;
    materialsReceivedToday: number; equipmentRunning: number;
  };
  alerts: { type: string; message: string; link: string; severity: string }[];
  progress: {
    currentMilestone: { name: string; targetDate: string; status: string } | null;
    completionPercent: number;
    nextMilestone: { name: string; targetDate: string } | null;
    recentDpr: { date: string; summary: string; site: string } | null;
    totalMilestones: number; completedMilestones: number;
  };
  recentActivity: { id: string; type: string; action: string; description: string; time: string; metadata: any }[];
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">{children}</p>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-border ${className}`}>{children}</div>
  );
}

function fmt(n: number | null | undefined) {
  if (!n) return '₹0';
  return `₹${n.toLocaleString('en-IN')}`;
}

export default function ProjectCommandCenter() {
  const { activeProject, activeProjectId, loading: projectLoading } = useProject();
  const navigate = useNavigate();
  const [data, setData] = useState<ProjectSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeProjectId) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    apiClient.get<ProjectSummary>(`/project-summary?project_id=${activeProjectId}`)
      .then(res => {
        if (res.data) setData(res.data);
      })
      .catch(err => console.error('Failed to load project summary', err))
      .finally(() => setLoading(false));
  }, [activeProjectId]);

  if (projectLoading || loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-[#2648E7] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!activeProjectId || !activeProject) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6 text-center">
        <h2 className="text-xl font-bold text-foreground">Select a Project</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          Choose a project from the switcher above to view your command center.
        </p>
      </div>
    );
  }

  const project = data?.project;
  const summary = data?.todaySummary;
  const progress = data?.progress;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Hero */}
      <div className="rounded-2xl p-5 text-white" style={{ backgroundColor: "#2648E7" }}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-blue-200 font-medium">Project Progress</p>
            <p className="text-3xl font-bold mt-0.5" style={{ fontFamily: "var(--font-display)" }}>{project?.progress_percentage || 0}%</p>
            <p className="text-sm text-blue-200 mt-0.5">Budget used: {fmt(project?.actual_cost)} of {fmt(project?.budget)}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1.5 justify-end mb-1">
              <CloudSun size={16} />
              <span className="text-xl font-bold">32°C</span>
            </div>
            <p className="text-xs text-blue-200">Clear · Good visibility</p>
            <p className="text-xs text-blue-200 mt-0.5">
              Due: {project?.end_date ? new Date(project.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '--'}
            </p>
          </div>
        </div>
        <div className="h-2 rounded-full bg-white/20 overflow-hidden">
          <div className="h-full rounded-full bg-white" style={{ width: `${project?.progress_percentage || 0}%` }} />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: <Users size={18} className="text-[#2648E7]" />, val: `${summary?.labourCount || 0}`, label: "Workers Today", bg: "bg-[#2648E7]/8" },
          { icon: <IndianRupee size={18} className="text-red-500" />, val: fmt(summary?.todayExpense), label: "Today's Spend", bg: "bg-red-50" },
          { icon: <Package size={18} className="text-amber-600" />, val: `${summary?.pendingMaterialRequests || 0}`, label: "Pending Material", bg: "bg-amber-50" },
        ].map((s, i) => (
          <Card key={i} className="p-4 text-center">
            <div className={`size-9 rounded-xl ${s.bg} flex items-center justify-center mx-auto mb-2`}>{s.icon}</div>
            <p className="text-xl font-bold text-foreground">{s.val}</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Needs attention */}
      <div>
        <SectionLabel>Needs Attention</SectionLabel>
        <div className="space-y-2">
          {[
            { color: "#f59e0b", icon: <Package size={16} className="text-amber-500" />, title: `${summary?.pendingMaterialRequests || 0} Material Requests Pending`, sub: "Approval needed", link: "/purchase?tab=requests" },
            { color: "#ef4444", icon: <IndianRupee size={16} className="text-red-500" />, title: `${summary?.pendingVendorPayments || 0} Vendor Payments Due`, sub: "Overdue payments", link: "/finance" },
            { color: "#6366f1", icon: <Users size={16} className="text-indigo-500" />, title: "Attendance Not Submitted", sub: "Mark today's attendance now", link: "/operations?tab=labour" },
          ].map((a) => (
            <button
              key={a.title}
              onClick={() => navigate(a.link)}
              className="w-full bg-white rounded-xl px-4 py-3.5 border-l-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow text-left"
              style={{ borderLeftColor: a.color }}
            >
              <span className="shrink-0">{a.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{a.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{a.sub}</p>
              </div>
              <ChevronRight size={14} className="text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <SectionLabel>Quick Actions</SectionLabel>
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: <IndianRupee size={20} />, label: "Add Expense", style: { backgroundColor: "#2648E7" }, textClass: "text-white", link: "/finance?create=true" },
            { icon: <Package size={20} />, label: "Material Request", bg: "bg-amber-50", textClass: "text-amber-700", link: "/purchase?tab=requests" },
            { icon: <Users size={20} />, label: "Attendance", bg: "bg-purple-50", textClass: "text-purple-700", link: "/operations?tab=labour" },
            { icon: <TrendingUp size={20} />, label: "Daily Progress", bg: "bg-emerald-50", textClass: "text-emerald-700", link: "/progress?tab=timeline" },
            { icon: <ShoppingCart size={20} />, label: "Purchase", bg: "bg-orange-50", textClass: "text-orange-700", link: "/purchase?tab=boq" },
            { icon: <Wallet size={20} />, label: "Finance", bg: "bg-rose-50", textClass: "text-rose-700", link: "/finance" },
          ].map(({ icon, label, style, bg, textClass, link }) => (
            <button
              key={label}
              onClick={() => navigate(link)}
              className={`rounded-2xl p-4 flex flex-col items-center gap-2 border border-transparent shadow-sm hover:shadow-md transition-shadow active:scale-95 ${bg ?? ""} ${textClass}`}
              style={style}
            >
              {icon}
              <p className="text-xs font-bold text-center leading-tight">{label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Next milestone */}
      {progress?.nextMilestone && (
        <div>
          <SectionLabel>Next Milestone</SectionLabel>
          <Card className="p-4 flex items-center gap-4">
            <div className="size-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "#FCC300" }}>
              <Calendar size={20} className="text-gray-900" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-foreground">{progress.nextMilestone.name}</p>
              <p className="text-sm text-muted-foreground mt-0.5">Due: {new Date(progress.nextMilestone.targetDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-amber-600">
                {Math.max(0, Math.ceil((new Date(progress.nextMilestone.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} days
              </p>
              <p className="text-xs text-muted-foreground">remaining</p>
            </div>
          </Card>
        </div>
      )}

      {/* Supervisor */}
      <Card className="p-4 flex items-center gap-3">
        <div className="size-10 rounded-full bg-[#2648E7]/10 flex items-center justify-center shrink-0">
          <HardHat size={18} className="text-[#2648E7]" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Site Supervisor</p>
          <p className="font-bold text-sm text-foreground">{project?.supervisor || 'Not Assigned'}</p>
        </div>
        <span className="ml-auto text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-bold">On Site</span>
      </Card>
    </div>
  );
}
