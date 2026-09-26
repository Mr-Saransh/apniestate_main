import { useState, useEffect, useCallback, useMemo } from 'react';
import { useProject } from '@/context/ProjectContext';
import { useSearchParams } from 'react-router-dom';
import {
  projectIntelligenceApi,
  type ProjectIntelligenceData,
  type IntelligenceSuggestion,
  type QomVariance,
  type WorkTableSummary,
  type MilestoneComparison,
  type Bottleneck,
  type Insight,
} from '@/api/projectIntelligence';
import {
  HeartPulse, Brain, Activity, Wallet, ShoppingCart, Calendar, Users,
  AlertTriangle, CheckCircle2, Clock, TrendingUp, TrendingDown,
  ArrowUpRight, ChevronRight, Sparkles, ShieldCheck, ShieldAlert,
  Package, Zap, Lightbulb, Target, Wrench, BarChart3, PieChart,
  Edit3, Trash2, Check, CheckCheck, Plus, RefreshCw, Info, X,
  ArrowDown, ArrowUp, Layers, ChevronDown, ChevronUp, Search,
  Building2, HardHat, Droplet, Paintbrush
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar as RechartsBar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Cell as RechartsCell,
  ReferenceLine,
  CartesianGrid,
  PieChart as RechartsPieChart,
  Pie as RechartsPie,
} from 'recharts';

// ─── Utility Functions ──────────────────────────────────────

function fmt(n: number | null | undefined): string {
  if (!n || n === 0) return '₹0';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return '--';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function shortDate(d: string | null | undefined): string {
  if (!d) return '--';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'OPTIMAL': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'WATCH': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'CRITICAL': return 'bg-rose-50 text-rose-700 border-rose-200';
    default: return 'bg-gray-50 text-gray-600 border-gray-200';
  }
}

function getScoreTheme(score: number) {
  if (score >= 90) return { text: 'text-emerald-700', bg: 'bg-emerald-500', soft: 'bg-emerald-50', border: 'border-emerald-200', label: 'Optimal' };
  if (score >= 75) return { text: 'text-blue-700', bg: 'bg-[#2648E7]', soft: 'bg-blue-50', border: 'border-blue-200', label: 'Stable' };
  if (score >= 60) return { text: 'text-amber-700', bg: 'bg-amber-500', soft: 'bg-amber-50', border: 'border-amber-200', label: 'Watch' };
  return { text: 'text-rose-700', bg: 'bg-rose-500', soft: 'bg-rose-50', border: 'border-rose-200', label: 'Critical' };
}

function getWorkTableIcon(name: string) {
  const n = (name || '').toLowerCase();
  if (n.includes('earth') || n.includes('excav')) return <HardHat size={16} className="text-amber-600" />;
  if (n.includes('concrete') || n.includes('rcc') || n.includes('cement')) return <Building2 size={16} className="text-blue-600" />;
  if (n.includes('steel') || n.includes('rebar') || n.includes('reinforcement')) return <Layers size={16} className="text-indigo-600" />;
  if (n.includes('plumb') || n.includes('sanit') || n.includes('drain')) return <Droplet size={16} className="text-cyan-600" />;
  if (n.includes('electr') || n.includes('power')) return <Zap size={16} className="text-amber-500" />;
  if (n.includes('paint') || n.includes('finish') || n.includes('plaster')) return <Paintbrush size={16} className="text-purple-600" />;
  return <Package size={16} className="text-emerald-600" />;
}

const HealthScoreTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-white border border-border rounded-xl shadow-lg p-3 text-xs">
        <p className="font-bold text-foreground text-xs mb-1">{d.name} Dimension</p>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-muted-foreground">Score:</span>
          <span className={`font-extrabold ${d.score >= 90 ? 'text-emerald-600' : d.score >= 75 ? 'text-blue-600' : d.score >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>
            {d.score} / 100
          </span>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getStatusColor(d.status)}`}>
            {d.status}
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground max-w-[190px] leading-relaxed">{d.summary}</p>
      </div>
    );
  }
  return null;
};

const CapitalTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-white border border-border rounded-xl shadow-lg p-2.5 text-xs">
        <p className="font-bold text-foreground text-xs">{d.name}</p>
        <p className="text-sm font-extrabold text-[#2648E7] mt-0.5">{fmt(d.value)}</p>
        {d.percent !== undefined && (
          <p className="text-[10px] text-muted-foreground mt-0.5">{d.percent}% of total capital</p>
        )}
      </div>
    );
  }
  return null;
};

const MilestoneTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-white border border-border rounded-xl shadow-lg p-2.5 text-xs">
        <p className="font-bold text-foreground text-xs">{d.name}</p>
        <p className="text-sm font-extrabold mt-0.5" style={{ color: d.color }}>
          {d.value} {d.value === 1 ? 'Milestone' : 'Milestones'}
        </p>
        {d.percent !== undefined && (
          <p className="text-[10px] text-muted-foreground mt-0.5">{d.percent}% of total</p>
        )}
      </div>
    );
  }
  return null;
};

// ─── Card Component ─────────────────────────────────────────

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white rounded-2xl shadow-sm border border-border ${className}`}>{children}</div>;
}

// ─── Main Page Component ────────────────────────────────────

export default function ProjectIntelligencePage() {
  const { activeProject, activeProjectId, loading: projectLoading } = useProject();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'health' | 'intelligence'>(tabParam === 'intelligence' ? 'intelligence' : 'health');
  const [data, setData] = useState<ProjectIntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!activeProjectId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await projectIntelligenceApi.getData(activeProjectId);
      if (res.data) setData(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load intelligence data');
    } finally {
      setLoading(false);
    }
  }, [activeProjectId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (tabParam === 'intelligence') setActiveTab('intelligence');
    else if (tabParam === 'health' || tabParam === 'construction-health') setActiveTab('health');
  }, [tabParam]);

  const handleTabChange = (tab: 'health' | 'intelligence') => {
    setActiveTab(tab);
    setSearchParams({ tab: tab === 'health' ? 'construction-health' : 'intelligence' });
  };

  if (projectLoading || loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-[#2648E7] border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">Loading Intelligence...</p>
        </div>
      </div>
    );
  }

  if (!activeProjectId || !activeProject) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6 text-center">
        <Brain size={48} className="text-muted-foreground/30" />
        <h2 className="text-xl font-bold text-foreground">Select a Project</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          Choose a project from the switcher above to view intelligence data.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6 text-center">
        <AlertTriangle size={48} className="text-amber-500" />
        <h2 className="text-lg font-bold text-foreground">Unable to Load Data</h2>
        <p className="text-sm text-muted-foreground max-w-sm">{error}</p>
        <button onClick={fetchData} className="px-4 py-2 bg-[#2648E7] text-white rounded-xl text-sm font-bold hover:bg-[#1d38b8] transition-colors">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5 pb-24">
      {/* Page Header */}
      <div>
        <h1 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
          <Brain size={22} className="text-[#2648E7]" />
          Project Intelligence
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {activeProject.name} — Detailed analysis and insights
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex bg-muted/60 rounded-xl p-1 gap-1">
        <button
          onClick={() => handleTabChange('health')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'health'
              ? 'bg-white shadow-sm text-[#2648E7]'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <HeartPulse size={16} />
          Construction Health
        </button>
        <button
          onClick={() => handleTabChange('intelligence')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'intelligence'
              ? 'bg-white shadow-sm text-[#2648E7]'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Brain size={16} />
          Project Intelligence
        </button>
      </div>

      {/* Content */}
      {activeTab === 'health' ? (
        <ConstructionHealthTab data={data} />
      ) : (
        <ProjectIntelligenceTab data={data} onRefresh={fetchData} />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB 1: CONSTRUCTION HEALTH
// ═══════════════════════════════════════════════════════════

function ConstructionHealthTab({ data }: { data: ProjectIntelligenceData | null }) {
  if (!data) return null;

  const { health, milestoneComparison, overallScheduleProgress, workforce, procurement } = data;
  const theme = getScoreTheme(health.compositeScore);

  const factors = [
    { id: 'finance', title: 'Finance & Budget', icon: <Wallet size={16} className="text-emerald-600" />, factor: health.factors.finance },
    { id: 'procurement', title: 'Procurement & Materials', icon: <ShoppingCart size={16} className="text-orange-600" />, factor: health.factors.procurement },
    { id: 'schedule', title: 'Schedule & Milestones', icon: <Calendar size={16} className="text-blue-600" />, factor: health.factors.schedule },
    { id: 'operations', title: 'Operations & Workforce', icon: <Users size={16} className="text-purple-600" />, factor: health.factors.operations },
  ];

  // 1. Dimension Bar Chart Data
  const barData = [
    {
      name: 'Finance',
      fullName: 'Finance & Budget',
      score: health.factors.finance.score,
      status: health.factors.finance.status,
      summary: `Budget utilization at ${health.budgetUtilization}%. ${health.pendingPaymentCount || 0} pending payment liabilities.`,
      color: health.factors.finance.score >= 90 ? '#10b981' : health.factors.finance.score >= 75 ? '#2648E7' : health.factors.finance.score >= 60 ? '#f59e0b' : '#ef4444',
    },
    {
      name: 'Procure',
      fullName: 'Procurement & Materials',
      score: health.factors.procurement.score,
      status: health.factors.procurement.status,
      summary: `${procurement.lowStockItems.length} low stock alerts, ${procurement.delayedPOs.length} delayed POs.`,
      color: health.factors.procurement.score >= 90 ? '#10b981' : health.factors.procurement.score >= 75 ? '#2648E7' : health.factors.procurement.score >= 60 ? '#f59e0b' : '#ef4444',
    },
    {
      name: 'Schedule',
      fullName: 'Schedule & Milestones',
      score: health.factors.schedule.score,
      status: health.factors.schedule.status,
      summary: `${milestoneComparison.filter(m => m.status === 'COMPLETED').length}/${milestoneComparison.length || 0} milestones completed. Overall progress: ${overallScheduleProgress}%.`,
      color: health.factors.schedule.score >= 90 ? '#10b981' : health.factors.schedule.score >= 75 ? '#2648E7' : health.factors.schedule.score >= 60 ? '#f59e0b' : '#ef4444',
    },
    {
      name: 'Operations',
      fullName: 'Operations & Workforce',
      score: health.factors.operations.score,
      status: health.factors.operations.status,
      summary: `${workforce.todayCount} workers on site today, ${workforce.dprSubmitted}/${workforce.activeSites || 1} DPRs submitted.`,
      color: health.factors.operations.score >= 90 ? '#10b981' : health.factors.operations.score >= 75 ? '#2648E7' : health.factors.operations.score >= 60 ? '#f59e0b' : '#ef4444',
    },
  ];

  // 2. Capital Donut / Pie Chart Data
  const totalBudget = health.totalBudget || 0;
  const actualSpend = health.actualSpend || 0;
  const remainingBudget = Math.max(0, totalBudget - actualSpend);
  const exposure = health.pendingPaymentExposure || 0;
  const totalCapitalConsidered = Math.max(totalBudget, actualSpend + exposure);

  const capitalPieData = totalCapitalConsidered > 0 ? [
    {
      name: 'Spent Capital',
      value: actualSpend,
      color: '#2648E7',
      percent: Math.round((actualSpend / totalCapitalConsidered) * 100),
    },
    {
      name: 'Remaining Budget',
      value: remainingBudget,
      color: '#10b981',
      percent: Math.round((remainingBudget / totalCapitalConsidered) * 100),
    },
    ...(exposure > 0 ? [{
      name: 'Pending Liabilities',
      value: exposure,
      color: '#f59e0b',
      percent: Math.round((exposure / totalCapitalConsidered) * 100),
    }] : [])
  ].filter(d => d.value > 0) : [];

  // 3. Milestone Donut Chart Data
  const totalMilestones = milestoneComparison.length;
  const completedMilestones = milestoneComparison.filter(m => m.status === 'COMPLETED').length;
  const overdueMilestones = milestoneComparison.filter(m => m.isOverdue && m.status !== 'COMPLETED').length;
  const onTrackMilestones = Math.max(0, totalMilestones - completedMilestones - overdueMilestones);

  const milestonePieData = totalMilestones > 0 ? [
    { name: 'Completed', value: completedMilestones, color: '#10b981', percent: Math.round((completedMilestones / totalMilestones) * 100) },
    { name: 'On Track', value: onTrackMilestones, color: '#2648E7', percent: Math.round((onTrackMilestones / totalMilestones) * 100) },
    { name: 'Overdue / Delay', value: overdueMilestones, color: '#ef4444', percent: Math.round((overdueMilestones / totalMilestones) * 100) },
  ].filter(d => d.value > 0) : [];

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Overall Construction Health Executive Score */}
      <Card className="overflow-hidden">
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`size-12 rounded-xl flex items-center justify-center ${theme.soft} ${theme.text}`}>
                <HeartPulse size={26} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Overall Construction Health</h3>
                <p className="text-xs text-muted-foreground">Real-time cross-functional health evaluation based on live site ERP data</p>
              </div>
            </div>
            <div className="flex items-baseline gap-1 bg-muted/50 border border-border px-4 py-2 rounded-xl">
              <span className={`text-3xl font-extrabold ${theme.text}`}>{health.compositeScore}</span>
              <span className="text-sm text-muted-foreground font-semibold">/100</span>
            </div>
          </div>

          {/* Health Bar */}
          <div className="mt-4 space-y-1.5">
            <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
              <div className={`h-full transition-all duration-1000 ease-out rounded-full ${theme.bg}`} style={{ width: `${health.compositeScore}%` }} />
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground font-medium">
              <span className="text-rose-500">Critical (&lt;60)</span>
              <span className="text-amber-500">Watch (60-74)</span>
              <span className="text-blue-500">Stable (75-89)</span>
              <span className="text-emerald-500">Optimal (90+)</span>
            </div>
          </div>

          <div className={`mt-3 px-3 py-2 rounded-xl text-xs flex items-center gap-2 border ${theme.soft} ${theme.border}`}>
            <Sparkles size={14} className={theme.text} />
            <span className="text-foreground text-[11px] font-medium leading-relaxed">
              <strong className={theme.text}>{health.overallStatus} Construction Health</strong> — {theme.label === 'Optimal' ? 'All construction departments operating safely within designated project thresholds.' : theme.label === 'Stable' ? 'Construction health is stable with minor areas of attention.' : theme.label === 'Watch' ? 'Active watchpoints detected — prompt site adjustments recommended to avoid slippage.' : 'Critical construction bottlenecks require immediate executive review and action.'}
            </span>
          </div>
        </div>
      </Card>

      {/* Visual Analytics Deck: Bar Chart & Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Visual 1: Dimensions Health Score (Bar Chart) */}
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#2648E7]">
                  <BarChart3 size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Dimension Health Scores</h4>
                  <p className="text-[11px] text-muted-foreground">Scored 0–100 across core operations</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-lg">
                <span className="w-2.5 h-0.5 bg-slate-400 inline-block border-b border-dashed"></span>
                <span>Target: 75</span>
              </div>
            </div>

            {/* Recharts Bar Chart */}
            <div className="h-52 w-full mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={barData} margin={{ top: 12, right: 12, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <ReferenceLine y={75} stroke="#94a3b8" strokeDasharray="3 3" />
                  <RechartsTooltip content={<HealthScoreTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.03)' }} />
                  <RechartsBar dataKey="score" radius={[6, 6, 0, 0]} maxBarSize={42}>
                    {barData.map((entry, index) => (
                      <RechartsCell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </RechartsBar>
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick status bar below chart */}
          <div className="grid grid-cols-4 gap-2 pt-3 border-t border-border/60 mt-2">
            {barData.map(b => (
              <div key={b.name} className="text-center">
                <span className="text-[10px] text-muted-foreground block truncate">{b.name}</span>
                <span className="text-xs font-bold" style={{ color: b.color }}>{b.score}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Visual 2: Capital Allocation & Liabilities (Pie / Donut Chart) */}
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <PieChart size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Capital Allocation & Exposure</h4>
                  <p className="text-[11px] text-muted-foreground">Spent vs Remaining vs Pending Liabilities</p>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${health.budgetUtilization > 90 ? 'bg-rose-50 text-rose-700 border-rose-200' : health.budgetUtilization > 75 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                {health.budgetUtilization}% Utilized
              </span>
            </div>

            {capitalPieData.length > 0 ? (
              <div className="flex flex-col sm:flex-row items-center gap-3 mt-3">
                {/* Donut Chart with Center Metric */}
                <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <RechartsTooltip content={<CapitalTooltip />} />
                      <RechartsPie
                        data={capitalPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={4}
                      >
                        {capitalPieData.map((entry, index) => (
                          <RechartsCell key={`cap-cell-${index}`} fill={entry.color} />
                        ))}
                      </RechartsPie>
                    </RechartsPieChart>
                  </ResponsiveContainer>
                  {/* Center Metric */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                    <span className="text-lg font-black text-foreground">{health.budgetUtilization}%</span>
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Spent</span>
                  </div>
                </div>

                {/* Legend & Breakdown */}
                <div className="flex-1 w-full space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50/50 border border-blue-100">
                    <div className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full bg-[#2648E7] shrink-0" />
                      <span className="text-muted-foreground text-[11px] font-medium">Spent Capital</span>
                    </div>
                    <span className="font-bold text-foreground">{fmt(actualSpend)}</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/50 border border-emerald-100">
                    <div className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full bg-emerald-500 shrink-0" />
                      <span className="text-muted-foreground text-[11px] font-medium">Remaining Budget</span>
                    </div>
                    <span className="font-bold text-emerald-700">{fmt(remainingBudget)}</span>
                  </div>

                  {exposure > 0 && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50/50 border border-amber-100">
                      <div className="flex items-center gap-2">
                        <span className="size-2.5 rounded-full bg-amber-500 shrink-0" />
                        <span className="text-muted-foreground text-[11px] font-medium">Pending Invoices</span>
                      </div>
                      <span className="font-bold text-amber-700">{fmt(exposure)}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-xs text-muted-foreground bg-muted/20 rounded-xl mt-3">
                <Info size={18} className="mx-auto mb-1.5 text-blue-400" />
                No budget specified for this project yet.
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-3 border-t border-border/60 mt-2">
            <span>Total Capital: <strong className="text-foreground">{fmt(totalBudget)}</strong></span>
            {exposure > 0 && (
              <span className="text-amber-600 font-medium">{health.pendingPaymentCount || 0} unpaid bills</span>
            )}
          </div>
        </Card>
      </div>

      {/* Construction Health Dimensions */}
      <div>
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Construction Health Dimensions</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {factors.map((f) => {
            const st = getScoreTheme(f.factor.score);
            return (
              <Card key={f.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-lg bg-muted/60 flex items-center justify-center">{f.icon}</div>
                    <h4 className="text-xs font-bold text-foreground">{f.title}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(f.factor.status)}`}>{f.factor.status}</span>
                    <span className="text-sm font-bold text-foreground">{f.factor.score}<span className="text-[10px] text-muted-foreground">/100</span></span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ${st.bg}`} style={{ width: `${f.factor.score}%` }} />
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Schedule & Milestones with Status Distribution Donut */}
      {milestoneComparison.length > 0 ? (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Calendar size={16} className="text-blue-600" />
              Schedule & Milestone Health
            </h4>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">
                Progress: <strong className="text-foreground">{overallScheduleProgress}%</strong>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-muted/60 text-muted-foreground">
                {completedMilestones}/{totalMilestones} Completed
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-center">
            {/* Donut Chart of Milestone Status */}
            <div className="flex flex-col items-center justify-center p-3 bg-muted/20 rounded-xl border border-border/50">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Status Distribution</p>
              <div className="relative w-36 h-36 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <RechartsTooltip content={<MilestoneTooltip />} />
                    <RechartsPie
                      data={milestonePieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={42}
                      outerRadius={58}
                      paddingAngle={3}
                    >
                      {milestonePieData.map((entry, index) => (
                        <RechartsCell key={`ms-cell-${index}`} fill={entry.color} />
                      ))}
                    </RechartsPie>
                  </RechartsPieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-base font-extrabold text-foreground">{completedMilestones}/{totalMilestones}</span>
                  <span className="text-[8px] uppercase tracking-wider text-muted-foreground font-semibold">Done</span>
                </div>
              </div>

              {/* Status Chips */}
              <div className="flex flex-wrap justify-center gap-2 mt-2 text-[10px]">
                <span className="flex items-center gap-1 font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  {completedMilestones} Done
                </span>
                <span className="flex items-center gap-1 font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  <span className="size-1.5 rounded-full bg-blue-500" />
                  {onTrackMilestones} Active
                </span>
                {overdueMilestones > 0 && (
                  <span className="flex items-center gap-1 font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                    <span className="size-1.5 rounded-full bg-rose-500" />
                    {overdueMilestones} Overdue
                  </span>
                )}
              </div>
            </div>

            {/* Milestone List */}
            <div className="lg:col-span-2 space-y-2 max-h-56 overflow-y-auto pr-1">
              {milestoneComparison.map((m) => (
                <div key={m.id} className={`flex items-center gap-3 p-2.5 rounded-xl border ${m.isOverdue ? 'border-rose-200 bg-rose-50/50' : m.status === 'COMPLETED' ? 'border-emerald-200 bg-emerald-50/50' : 'border-border bg-white'}`}>
                  <div className={`size-7 rounded-lg flex items-center justify-center shrink-0 ${m.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-600' : m.isOverdue ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}`}>
                    {m.status === 'COMPLETED' ? <CheckCircle2 size={14} /> : m.isOverdue ? <AlertTriangle size={14} /> : <Clock size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{m.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      Target: {fmtDate(m.targetDate)}
                      {m.isOverdue && <span className="text-rose-600 font-bold ml-1">({m.daysOverdue}d overdue)</span>}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-xs font-bold ${m.status === 'COMPLETED' ? 'text-emerald-600' : m.isOverdue ? 'text-rose-600' : 'text-foreground'}`}>
                      {m.actualProgress}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-6 text-center">
          <Calendar size={24} className="mx-auto text-muted-foreground/30 mb-2" />
          <p className="text-sm font-bold text-foreground">No Milestones Defined</p>
          <p className="text-xs text-muted-foreground mt-1">Use the Intelligence tab to generate suggested milestones</p>
        </Card>
      )}

      {/* Workforce Status */}
      <Card className="p-4">
        <h4 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
          <Users size={16} className="text-purple-600" />
          Operations & Workforce Capacity
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Workers Today', value: `${workforce.todayCount}`, isWarning: workforce.todayCount === 0 },
            { label: 'Labour Cost', value: fmt(workforce.todayCost) },
            { label: 'DPR Filed', value: `${workforce.dprSubmitted}/${workforce.activeSites}`, isWarning: workforce.dprSubmitted < workforce.activeSites },
            { label: 'Equipment', value: `${workforce.equipmentRunning} running` },
          ].map((m, i) => (
            <div key={i} className="bg-muted/40 rounded-xl p-3 text-center">
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{m.label}</p>
              <p className={`text-sm font-bold ${m.isWarning ? 'text-rose-600' : 'text-foreground'}`}>{m.value}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Procurement Status */}
      {(procurement.lowStockItems.length > 0 || procurement.delayedPOs.length > 0) && (
        <Card className="p-4">
          <h4 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
            <ShoppingCart size={16} className="text-orange-600" />
            Procurement Warnings
          </h4>
          <div className="space-y-2">
            {procurement.delayedPOs.map((po) => (
              <div key={po.id} className="flex items-center gap-2 p-2 rounded-lg bg-rose-50/60 border border-rose-200 text-xs">
                <Clock size={14} className="text-rose-500 shrink-0" />
                <span className="flex-1 text-rose-800 font-medium truncate">PO {po.poNumber} from {po.vendor} — overdue</span>
                <span className="text-rose-600 font-bold shrink-0">{fmt(po.amount)}</span>
              </div>
            ))}
            {procurement.lowStockItems.map((item, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-amber-50/60 border border-amber-200 text-xs">
                <Package size={14} className="text-amber-500 shrink-0" />
                <span className="flex-1 text-amber-800 font-medium truncate">{item.material} — {item.current} {item.unit} (min: {item.minimum})</span>
                <span className="text-amber-600 font-bold shrink-0">{item.site}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Work Tables Component (Compact Scope View) ─────────────

function WorkTablesSection({ data }: { data: ProjectIntelligenceData }) {
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'WATCH' | 'OPTIMAL'>('ALL');
  const [search, setSearch] = useState('');

  const tables: WorkTableSummary[] = useMemo(() => {
    if (data.workTables && data.workTables.length > 0) {
      return data.workTables;
    }
    if (!data.qomVariances || data.qomVariances.length === 0) {
      return [];
    }
    // Fallback: group items into a default table if workTables is empty
    const items = data.qomVariances;
    const overusedCount = items.filter(i => i.percentUsed > 100).length;
    const avgPct = items.length > 0 ? Math.round(items.reduce((s, i) => s + i.percentUsed, 0) / items.length) : 0;
    return [{
      id: 'general-construction',
      name: 'General Construction Works',
      itemsCount: items.length,
      totalPlannedCost: 0,
      totalUsedCost: 0,
      totalVarianceCost: 0,
      percentUsed: avgPct,
      status: overusedCount > 0 ? 'critical' : avgPct > 85 ? 'watch' : 'optimal',
      statusLabel: overusedCount > 0 ? 'Over-consumption' : avgPct > 85 ? 'Near Limit' : 'On Track',
      overusedCount,
      lowRemainingCount: items.filter(i => i.status === 'low_remaining').length,
      items: items.map(v => ({
        id: v.id,
        name: v.name,
        materialName: v.materialName,
        unit: v.unit,
        planned: v.planned,
        used: v.used,
        remaining: v.remaining,
        percentUsed: v.percentUsed,
        variance: v.variance,
        status: v.status,
      }))
    }];
  }, [data.workTables, data.qomVariances]);

  const filteredTables = useMemo(() => {
    return tables.filter((t) => {
      if (filter === 'CRITICAL' && t.status !== 'critical') return false;
      if (filter === 'WATCH' && t.status !== 'watch') return false;
      if (filter === 'OPTIMAL' && t.status !== 'optimal') return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = t.name.toLowerCase().includes(q);
        const matchItem = t.items.some((it: any) => (it.materialName || it.name || '').toLowerCase().includes(q));
        if (!matchName && !matchItem) return false;
      }
      return true;
    });
  }, [tables, filter, search]);

  const toggleTable = (id: string) => {
    setExpandedTables(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAll = (expand: boolean) => {
    const next: Record<string, boolean> = {};
    tables.forEach(t => { next[t.id] = expand; });
    setExpandedTables(next);
  };

  const allExpanded = tables.length > 0 && tables.every(t => expandedTables[t.id]);

  if (tables.length === 0) {
    return (
      <Card className="p-6 text-center">
        <Package size={24} className="mx-auto text-muted-foreground/30 mb-2" />
        <p className="text-sm font-bold text-foreground">No QOM Work Tables Available</p>
        <p className="text-xs text-muted-foreground mt-1">Add BOQ / QOM items to view work table intelligence</p>
      </Card>
    );
  }

  const criticalCount = tables.filter(t => t.status === 'critical').length;
  const watchCount = tables.filter(t => t.status === 'watch').length;
  const optimalCount = tables.filter(t => t.status === 'optimal').length;

  return (
    <Card className="p-4 sm:p-5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Layers size={16} className="text-[#2648E7]" />
              QOM — By Work Table
            </h4>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {tables.length} {tables.length === 1 ? 'Scope' : 'Scopes'}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Aggregated by construction scope for compact tracking and deviation detection
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => toggleAll(!allExpanded)}
            className="text-[11px] font-semibold text-[#2648E7] hover:underline px-2.5 py-1 rounded-lg bg-[#2648E7]/5 hover:bg-[#2648E7]/10 transition-colors"
          >
            {allExpanded ? 'Collapse All' : 'Expand All'}
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 mb-3.5">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors ${
              filter === 'ALL'
                ? 'bg-foreground text-background'
                : 'bg-muted/60 text-muted-foreground hover:text-foreground'
            }`}
          >
            All ({tables.length})
          </button>
          {criticalCount > 0 && (
            <button
              type="button"
              onClick={() => setFilter('CRITICAL')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors flex items-center gap-1 ${
                filter === 'CRITICAL'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
              }`}
            >
              <AlertTriangle size={11} /> Overrun ({criticalCount})
            </button>
          )}
          {watchCount > 0 && (
            <button
              type="button"
              onClick={() => setFilter('WATCH')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors ${
                filter === 'WATCH'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              Near Limit ({watchCount})
            </button>
          )}
          <button
            type="button"
            onClick={() => setFilter('OPTIMAL')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors ${
              filter === 'OPTIMAL'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            On Track ({optimalCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[190px]">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search work tables..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1 bg-muted/40 border border-border rounded-lg text-[11px] focus:outline-none focus:ring-1 focus:ring-[#2648E7]"
          />
        </div>
      </div>

      {/* Work Tables List */}
      <div className="space-y-2">
        {filteredTables.map((table) => {
          const isExpanded = !!expandedTables[table.id];
          const hasCost = table.totalPlannedCost > 0;

          return (
            <div
              key={table.id}
              className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                table.status === 'critical'
                  ? 'border-rose-200/90 bg-rose-50/20'
                  : table.status === 'watch'
                  ? 'border-amber-200/90 bg-amber-50/20'
                  : 'border-border bg-white hover:border-[#2648E7]/30'
              }`}
            >
              {/* Compact Work Table Header Row */}
              <div
                onClick={() => toggleTable(table.id)}
                className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
              >
                {/* Left: Icon & Title */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="size-8 rounded-lg bg-muted/60 flex items-center justify-center shrink-0">
                    {getWorkTableIcon(table.name)}
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <p className="text-xs sm:text-sm font-bold text-foreground truncate">
                        {table.name}
                      </p>
                      <span className="text-[10px] text-muted-foreground font-semibold px-2 py-0.5 rounded-md bg-muted/50 shrink-0">
                        {table.itemsCount} {table.itemsCount === 1 ? 'material' : 'materials'}
                      </span>
                    </div>
                    {hasCost ? (
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Budgeted: {fmt(table.totalPlannedCost)} · Spent: {fmt(table.totalUsedCost)}
                      </p>
                    ) : (
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Tracking {table.itemsCount} material quantities
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Metrics, Progress Bar, Status Badge & Toggle */}
                <div className="flex items-center gap-3 sm:gap-4 shrink-0 justify-between sm:justify-end">
                  {/* Progress & Variance */}
                  <div className="text-right min-w-[110px]">
                    <div className="flex items-baseline justify-end gap-1.5">
                      <span className={`text-xs font-bold ${
                        table.status === 'critical' ? 'text-rose-600' :
                        table.status === 'watch' ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                        {table.percentUsed}%
                      </span>
                      <span className="text-[10px] text-muted-foreground">used</span>
                    </div>
                    <div className="h-1.5 w-24 bg-muted rounded-full overflow-hidden mt-1 ml-auto">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          table.status === 'critical' ? 'bg-rose-500' :
                          table.status === 'watch' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, table.percentUsed)}%` }}
                      />
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full border whitespace-nowrap ${
                    table.status === 'critical'
                      ? 'bg-rose-100 text-rose-800 border-rose-200'
                      : table.status === 'watch'
                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {table.statusLabel}
                  </span>

                  {/* Expand Chevron */}
                  <button
                    type="button"
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                    aria-label="Toggle items"
                  >
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
              </div>

              {/* Collapsible Nested Item Details Table */}
              {isExpanded && (
                <div className="border-t border-border/80 bg-muted/20 px-3 sm:px-4 py-3">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-border/60 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          <th className="pb-2 font-bold">Item / Material</th>
                          <th className="pb-2 font-bold text-right">Planned</th>
                          <th className="pb-2 font-bold text-right">Used</th>
                          <th className="pb-2 font-bold text-right">Remaining</th>
                          <th className="pb-2 font-bold text-right">Variance</th>
                          <th className="pb-2 font-bold text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {table.items.map((item: any) => (
                          <tr key={item.id} className="hover:bg-muted/40 transition-colors">
                            <td className="py-2 pr-2 font-medium text-foreground max-w-[200px] truncate" title={item.materialName || item.name}>
                              {item.materialName || item.name}
                            </td>
                            <td className="py-2 px-2 text-right text-muted-foreground whitespace-nowrap">
                              {Number(item.planned).toLocaleString()} {item.unit}
                            </td>
                            <td className="py-2 px-2 text-right font-bold text-foreground whitespace-nowrap">
                              {Number(item.used).toLocaleString()} {item.unit}
                            </td>
                            <td className={`py-2 px-2 text-right whitespace-nowrap font-medium ${item.remaining === 0 ? 'text-rose-600' : 'text-muted-foreground'}`}>
                              {Number(item.remaining).toLocaleString()} {item.unit}
                            </td>
                            <td className={`py-2 px-2 text-right whitespace-nowrap font-bold ${item.variance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {item.variance > 0 ? `+${Number(item.variance).toFixed(2)}` : Number(item.variance).toFixed(2)} {item.unit}
                            </td>
                            <td className="py-2 pl-2 text-right whitespace-nowrap">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                                item.status === 'excess' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                item.status === 'high' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                item.status === 'low_remaining' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}>
                                {item.percentUsed}% ({item.status === 'excess' ? 'Excess' : item.status === 'high' ? 'High' : item.status === 'low_remaining' ? 'Low Stock' : 'Normal'})
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB 2: PROJECT INTELLIGENCE
// ═══════════════════════════════════════════════════════════

function ProjectIntelligenceTab({ data, onRefresh }: { data: ProjectIntelligenceData | null; onRefresh: () => void }) {
  const { activeProjectId } = useProject();
  const [suggestions, setSuggestions] = useState<IntelligenceSuggestion[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (data?.suggestions) setSuggestions(data.suggestions);
  }, [data?.suggestions]);

  // Smart Plan Generator modal state
  const [showConfigModal, setShowConfigModal] = useState(false);
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const [planConfig, setPlanConfig] = useState({
    builtUpArea: 2000,
    floors: 2, // G+1
    bhk: '3 BHK',
    startDate: todayStr,
    constructionPace: 'STANDARD' as 'STANDARD' | 'FAST' | 'RELAXED',
  });

  // Calculate live estimate for modal preview
  const previewCalculation = useMemo(() => {
    const area = Number(planConfig.builtUpArea) || 2000;
    const floors = Number(planConfig.floors) || 2;
    const paceMult = planConfig.constructionPace === 'FAST' ? 0.85 : (planConfig.constructionPace === 'RELAXED' ? 1.2 : 1.0);

    const footprint = Math.round(area / floors);
    const dFoundation = Math.round(Math.max(15, 18 + (footprint / 250)) * paceMult);
    const dStructure = Math.round(Math.max(20, 10 + (floors * 22)) * paceMult);
    const dBrickwork = Math.round(Math.max(14, 12 + (floors * 12) + 9) * paceMult);
    const dFinishes = Math.round(Math.max(14, 12 + (floors * 7) + (area / 300)) * paceMult);
    const dHandover = Math.round(14 * paceMult);

    const totalEstDays = Math.round((dFoundation * 0.7 + dStructure + dBrickwork * 0.4 + dFinishes + dHandover + 10) * paceMult);
    
    const startObj = new Date(planConfig.startDate || todayStr);
    const targetCompletion = new Date(startObj.getTime() + totalEstDays * 24 * 60 * 60 * 1000);

    return {
      totalDays: totalEstDays,
      months: (totalEstDays / 30.4).toFixed(1),
      targetDateFormatted: targetCompletion.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
      footprint,
    };
  }, [planConfig, todayStr]);

  const handleGenerate = async (customParams?: typeof planConfig) => {
    if (!activeProjectId) return;
    const cfg = customParams || planConfig;
    setActionLoading('generate');
    try {
      const res = await projectIntelligenceApi.generateSuggestions(activeProjectId, {
        builtUpArea: Number(cfg.builtUpArea) || 2000,
        floors: cfg.floors,
        bhk: cfg.bhk,
        startDate: cfg.startDate || todayStr,
        constructionPace: cfg.constructionPace,
      });
      if (res.data) { 
        setSuggestions(res.data); 
        showToast('Practical construction plan generated successfully!'); 
        setShowConfigModal(false);
        onRefresh();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to generate plan', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelPlan = async () => {
    if (!activeProjectId) return;
    setActionLoading('cancel-plan');
    try {
      await projectIntelligenceApi.cancelSuggestions(activeProjectId);
      setSuggestions([]);
      showToast('Generated project plan cancelled. You can regenerate anytime!');
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel plan', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEdit = (s: IntelligenceSuggestion) => {
    setEditingId(s.id);
    setEditForm({
      name: s.name,
      suggested_start: s.suggested_start ? new Date(s.suggested_start).toISOString().split('T')[0] : '',
      suggested_end: s.suggested_end ? new Date(s.suggested_end).toISOString().split('T')[0] : '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    setActionLoading(editingId);
    try {
      await projectIntelligenceApi.updateSuggestion(editingId, editForm);
      showToast('Suggestion updated');
      setEditingId(null);
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to update', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemove = async (id: string) => {
    setActionLoading(id);
    try {
      await projectIntelligenceApi.removeSuggestion(id);
      setSuggestions((prev) => prev.filter((s) => s.id !== id));
      showToast('Suggestion removed');
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to remove', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await projectIntelligenceApi.approveSuggestion(id);
      setSuggestions((prev) => prev.filter((s) => s.id !== id));
      showToast('Milestone approved & created');
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to approve', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveAll = async () => {
    if (!activeProjectId) return;
    setActionLoading('approve-all');
    try {
      const res = await projectIntelligenceApi.approveAll(activeProjectId);
      setSuggestions([]);
      showToast(res.message || 'All milestones approved');
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to approve all', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  if (!data) return null;

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg animate-in fade-in slide-in-from-right-4 ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
          {toast.message}
        </div>
      )}

      {/* Planned vs Actual Header */}
      <Card className="p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="size-10 rounded-xl bg-[#2648E7]/10 flex items-center justify-center">
            <Target size={20} className="text-[#2648E7]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Planned vs Actual Analysis</h3>
            <p className="text-[11px] text-muted-foreground">Comparing planned project state with actual execution data</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-3">
          <div className="bg-muted/40 rounded-xl p-3 text-center">
            <p className="text-[9px] uppercase text-muted-foreground">Schedule Progress</p>
            <p className="text-lg font-bold text-foreground">{data.overallScheduleProgress}%</p>
            <p className="text-[10px] text-muted-foreground">{data.milestonesExist ? 'Based on milestones' : 'No baseline'}</p>
          </div>
          <div className="bg-muted/40 rounded-xl p-3 text-center">
            <p className="text-[9px] uppercase text-muted-foreground">Budget Used</p>
            <p className="text-lg font-bold text-foreground">{data.health.budgetUtilization}%</p>
            <p className="text-[10px] text-muted-foreground">{data.hasBudget ? fmt(data.health.actualSpend) : 'No budget'}</p>
          </div>
          <div className="bg-muted/40 rounded-xl p-3 text-center">
            <p className="text-[9px] uppercase text-muted-foreground">Work Tables</p>
            <p className="text-lg font-bold text-foreground">
              {data.workTableStats?.totalTables ?? (data.workTables?.length || (data.qomVariances.length > 0 ? 1 : 0))}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {data.workTableStats?.criticalTables ? (
                <span className="text-rose-600 font-bold">{data.workTableStats.criticalTables} in overrun</span>
              ) : data.workTableStats?.watchTables ? (
                <span className="text-amber-600 font-bold">{data.workTableStats.watchTables} near limit</span>
              ) : (
                <span className="text-emerald-600 font-medium">All on track</span>
              )}
            </p>
          </div>
        </div>
      </Card>

      {/* QOM By Work Table */}
      <WorkTablesSection data={data} />

      {/* Milestone Planned vs Actual */}
      {data.milestoneComparison.length > 0 ? (
        <Card className="p-4">
          <h4 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
            <Calendar size={16} className="text-blue-600" />
            Planned vs Actual Schedule
          </h4>
          <div className="space-y-2">
            {data.milestoneComparison.map((m) => (
              <div key={m.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-border">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">{m.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex-1">
                      <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
                        <span>Actual: {m.actualProgress}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full rounded-full ${m.status === 'COMPLETED' ? 'bg-emerald-500' : m.isOverdue ? 'bg-rose-500' : 'bg-[#2648E7]'}`} style={{ width: `${m.actualProgress}%` }} />
                      </div>
                    </div>
                    <span className={`text-xs font-bold shrink-0 ${m.variance < 0 ? 'text-rose-600' : m.variance > 0 ? 'text-emerald-600' : 'text-foreground'}`}>
                      {m.variance > 0 ? '+' : ''}{m.variance}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {data.milestoneComparison.some(m => !m.isOverdue && m.status !== 'COMPLETED') && (
            <div className="mt-2 px-2 py-1.5 rounded-lg bg-blue-50/60 border border-blue-200 text-[10px] text-blue-700 flex items-center gap-1.5">
              <Info size={12} /> Schedule variance is based on approved milestone data
            </div>
          )}
        </Card>
      ) : (
        <Card className="p-4 text-center">
          <div className="py-2">
            <Info size={16} className="mx-auto text-blue-400 mb-1.5" />
            <p className="text-xs font-bold text-foreground">Schedule Intelligence</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Baseline unavailable — no approved milestones exist yet</p>
          </div>
        </Card>
      )}

      {/* Bottleneck Detection */}
      {data.bottlenecks.length > 0 && (
        <Card className="p-4">
          <h4 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
            <Zap size={16} className="text-rose-500" />
            Potential Bottlenecks Detected
          </h4>
          <div className="space-y-2.5">
            {data.bottlenecks.map((b, i) => (
              <div key={i} className={`p-3 rounded-xl border ${b.severity === 'high' ? 'border-rose-200 bg-rose-50/50' : 'border-amber-200 bg-amber-50/50'}`}>
                <div className="flex items-start gap-2">
                  <AlertTriangle size={14} className={`shrink-0 mt-0.5 ${b.severity === 'high' ? 'text-rose-500' : 'text-amber-500'}`} />
                  <div>
                    <p className={`text-xs font-bold ${b.severity === 'high' ? 'text-rose-800' : 'text-amber-800'}`}>{b.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{b.reason}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[10px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">{b.affectedArea}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#2648E7] font-bold">
                      <Wrench size={12} />
                      <span>{b.action}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Insights & Recommended Actions */}
      {data.insights.length > 0 && (
        <Card className="p-4">
          <h4 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
            <Lightbulb size={16} className="text-amber-500" />
            Insights & Recommended Actions
          </h4>
          <div className="space-y-2">
            {data.insights.map((insight, i) => (
              <div key={i} className={`p-2.5 rounded-xl border ${
                insight.severity === 'critical' ? 'border-rose-200 bg-rose-50/30' :
                insight.severity === 'warning' ? 'border-amber-200 bg-amber-50/30' :
                'border-blue-200 bg-blue-50/30'
              }`}>
                <p className="text-xs font-bold text-foreground">{insight.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{insight.detail}</p>
                <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-[#2648E7] font-bold">
                  <ArrowUpRight size={11} />
                  <span>{insight.action}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Suggested Project Plan */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Sparkles size={16} className="text-[#2648E7]" />
              Suggested Project Plan
              {suggestions.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-[#2648E7] text-[10px] font-extrabold">
                  {suggestions.length} Milestones
                </span>
              )}
            </h4>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Tailored for ~{planConfig.builtUpArea.toLocaleString()} sq ft ({planConfig.bhk}, {planConfig.floors === 1 ? 'Ground level' : `G+${planConfig.floors - 1}`})
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {suggestions.length > 0 && (
              <>
                <button
                  onClick={() => setShowConfigModal(true)}
                  disabled={actionLoading === 'generate'}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-[#2648E7] border border-blue-200 rounded-xl text-[11px] font-bold hover:bg-blue-100 transition-colors disabled:opacity-50"
                  title="Configure project scope & regenerate milestones"
                >
                  <RefreshCw size={13} className={actionLoading === 'generate' ? 'animate-spin' : ''} />
                  {actionLoading === 'generate' ? 'Regenerating...' : 'Regenerate Plan'}
                </button>
                <button
                  onClick={handleCancelPlan}
                  disabled={actionLoading === 'cancel-plan'}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-[11px] font-bold hover:bg-rose-100 transition-colors disabled:opacity-50"
                  title="Cancel this generated plan to start over"
                >
                  <X size={13} />
                  {actionLoading === 'cancel-plan' ? 'Cancelling...' : 'Cancel Plan'}
                </button>
                <button
                  onClick={handleApproveAll}
                  disabled={actionLoading === 'approve-all'}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 text-white rounded-xl text-[11px] font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-sm"
                >
                  <CheckCheck size={14} />
                  {actionLoading === 'approve-all' ? 'Approving...' : 'Approve All'}
                </button>
              </>
            )}
            {suggestions.length === 0 && (
              <button
                onClick={() => setShowConfigModal(true)}
                disabled={actionLoading === 'generate'}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#2648E7] text-white rounded-xl text-xs font-bold hover:bg-[#1d38b8] shadow-sm transition-all disabled:opacity-50"
              >
                <RefreshCw size={14} className={actionLoading === 'generate' ? 'animate-spin' : ''} />
                {actionLoading === 'generate' ? 'Generating Plan...' : 'Generate Project Plan'}
              </button>
            )}
          </div>
        </div>

        {suggestions.length === 0 ? (
          <div className="text-center py-8 px-4 bg-gradient-to-b from-blue-50/40 via-muted/20 to-transparent border border-dashed border-border rounded-2xl">
            <div className="size-12 rounded-2xl bg-blue-100 text-[#2648E7] flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Sparkles size={24} className="animate-pulse" />
            </div>
            <p className="text-sm font-bold text-foreground">No Milestone Plan Active</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
              Configure minimal parameters (Area, Floors & BHK) to generate a realistic, sequential construction schedule starting from today.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 mb-4">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white border border-border text-muted-foreground">Foundation</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white border border-border text-muted-foreground">Structure</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white border border-border text-muted-foreground">Masonry</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white border border-border text-muted-foreground">MEP</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white border border-border text-muted-foreground">Finishes</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white border border-border text-muted-foreground">Handover</span>
            </div>
            <button
              onClick={() => setShowConfigModal(true)}
              disabled={actionLoading === 'generate'}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2648E7] text-white rounded-xl text-xs font-bold hover:bg-[#1d38b8] shadow-md shadow-[#2648E7]/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              <Sparkles size={14} />
              {actionLoading === 'generate' ? 'Analyzing Timeline & Generating...' : 'Configure & Generate Plan'}
            </button>
            <p className="text-[10px] text-muted-foreground mt-3 italic">
              Suggested milestones are draft recommendations and won't alter your official timeline until you approve them.
            </p>
          </div>
        ) : (
          <>
            <div className="px-2 py-1.5 mb-3 rounded-lg bg-blue-50/60 border border-blue-200 text-[10px] text-blue-700 flex items-center gap-1.5">
              <Info size={12} /> These are suggestions only. They will NOT affect your timeline until approved.
            </div>
            <div className="space-y-2">
              {suggestions.map((s, idx) => (
                <div key={s.id} className="rounded-xl border border-border p-3 hover:border-[#2648E7]/30 transition-colors">
                  {editingId === s.id ? (
                    /* Edit Mode */
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-3 py-1.5 border border-border rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#2648E7]/30"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-muted-foreground block mb-0.5">Start Date</label>
                          <input
                            type="date"
                            value={editForm.suggested_start}
                            onChange={(e) => setEditForm({ ...editForm, suggested_start: e.target.value })}
                            className="w-full px-2 py-1 border border-border rounded-lg text-[11px] focus:outline-none focus:ring-2 focus:ring-[#2648E7]/30"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground block mb-0.5">End Date</label>
                          <input
                            type="date"
                            value={editForm.suggested_end}
                            onChange={(e) => setEditForm({ ...editForm, suggested_end: e.target.value })}
                            className="w-full px-2 py-1 border border-border rounded-lg text-[11px] focus:outline-none focus:ring-2 focus:ring-[#2648E7]/30"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingId(null)} className="px-3 py-1 text-[11px] text-muted-foreground hover:text-foreground rounded-lg border border-border">Cancel</button>
                        <button onClick={handleSaveEdit} disabled={actionLoading === s.id} className="px-3 py-1 text-[11px] bg-[#2648E7] text-white rounded-lg font-bold disabled:opacity-50">Save</button>
                      </div>
                    </div>
                  ) : (
                    /* View Mode */
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="size-6 rounded-lg bg-[#2648E7]/10 text-[#2648E7] flex items-center justify-center text-[10px] font-bold">{idx + 1}</span>
                          <div>
                            <p className="text-xs font-bold text-foreground">{s.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {shortDate(s.suggested_start)} → {shortDate(s.suggested_end)}
                              {s.duration_days && <span className="ml-1">({s.duration_days}d)</span>}
                            </p>
                          </div>
                        </div>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">SUGGESTED</span>
                      </div>
                      {s.reason && (
                        <p className="text-[10px] text-muted-foreground mt-1 ml-8 italic">{s.reason}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 ml-8">
                        <button onClick={() => handleEdit(s)} className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-muted-foreground hover:text-[#2648E7] rounded-lg border border-border hover:border-[#2648E7]/30 transition-colors">
                          <Edit3 size={11} /> Edit
                        </button>
                        <button
                          onClick={() => handleRemove(s.id)}
                          disabled={actionLoading === s.id}
                          className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-muted-foreground hover:text-rose-600 rounded-lg border border-border hover:border-rose-200 transition-colors disabled:opacity-50"
                        >
                          <Trash2 size={11} /> Remove
                        </button>
                        <button
                          onClick={() => handleApprove(s.id)}
                          disabled={actionLoading === s.id}
                          className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Check size={11} /> Approve
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* Smart Plan Setup Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-border p-6 my-8 space-y-5 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                  <Sparkles size={18} className="text-[#2648E7]" />
                  Smart Construction Plan Generator
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Civil engineering estimation engine tailored to your project scale.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="size-8 rounded-full bg-muted/60 text-muted-foreground hover:text-foreground flex items-center justify-center hover:bg-muted transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              {/* Built-up Area */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Total Built-up Area (sq ft)
                  </label>
                  <span className="text-[11px] text-[#2648E7] font-semibold">
                    ~{previewCalculation.footprint.toLocaleString()} sq ft / floor footprint
                  </span>
                </div>
                <input
                  type="number"
                  min="400"
                  max="100000"
                  step="100"
                  value={planConfig.builtUpArea}
                  onChange={(e) => setPlanConfig({ ...planConfig, builtUpArea: Number(e.target.value) || 0 })}
                  className="w-full bg-white border border-border rounded-xl px-3.5 py-2.5 text-sm font-bold text-foreground focus:outline-none focus:border-[#2648E7]"
                  placeholder="e.g. 2000"
                />
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {[1200, 1800, 2400, 3500, 5000].map((area) => (
                    <button
                      key={area}
                      type="button"
                      onClick={() => setPlanConfig({ ...planConfig, builtUpArea: area })}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                        planConfig.builtUpArea === area
                          ? 'bg-[#2648E7] text-white border-[#2648E7]'
                          : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted'
                      }`}
                    >
                      {area.toLocaleString()} sq ft
                    </button>
                  ))}
                </div>
              </div>

              {/* Number of Floors */}
              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">
                  Number of Floors (Levels)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Ground Only', floors: 1, desc: '1 level' },
                    { label: 'G+1', floors: 2, desc: '2 levels' },
                    { label: 'G+2', floors: 3, desc: '3 levels' },
                    { label: 'G+3+', floors: 4, desc: '4+ levels' },
                  ].map((fl) => (
                    <button
                      key={fl.floors}
                      type="button"
                      onClick={() => setPlanConfig({ ...planConfig, floors: fl.floors })}
                      className={`py-2 px-2 rounded-xl border text-center transition-all ${
                        planConfig.floors === fl.floors
                          ? 'bg-[#2648E7]/10 border-[#2648E7] text-[#2648E7]'
                          : 'bg-white border-border text-muted-foreground hover:border-gray-300'
                      }`}
                    >
                      <div className="text-xs font-extrabold">{fl.label}</div>
                      <div className="text-[10px] opacity-75">{fl.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Configuration BHK */}
              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">
                  Configuration / Layout (BHK)
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {['1 BHK', '2 BHK', '3 BHK', '4 BHK', '5+ BHK'].map((bhk) => (
                    <button
                      key={bhk}
                      type="button"
                      onClick={() => setPlanConfig({ ...planConfig, bhk })}
                      className={`py-2 px-1 rounded-xl border text-center text-xs font-bold transition-all ${
                        planConfig.bhk === bhk
                          ? 'bg-[#2648E7] text-white border-[#2648E7] shadow-sm'
                          : 'bg-white border-border text-muted-foreground hover:bg-muted/30'
                      }`}
                    >
                      {bhk}
                    </button>
                  ))}
                </div>
              </div>

              {/* Start Date (Strictly Today or Later) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-foreground flex items-center gap-1 mb-1.5">
                    <Calendar size={13} className="text-[#2648E7]" />
                    Planned Start Date
                  </label>
                  <input
                    type="date"
                    min={todayStr}
                    value={planConfig.startDate}
                    onChange={(e) => setPlanConfig({ ...planConfig, startDate: e.target.value })}
                    className="w-full bg-white border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-[#2648E7]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground flex items-center gap-1 mb-1.5">
                    <Zap size={13} className="text-amber-500" />
                    Construction Pace
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPlanConfig({ ...planConfig, constructionPace: 'STANDARD' })}
                      className={`py-2 px-2 rounded-xl border text-center text-[11px] font-bold transition-all ${
                        planConfig.constructionPace === 'STANDARD'
                          ? 'bg-[#2648E7]/10 border-[#2648E7] text-[#2648E7]'
                          : 'bg-white border-border text-muted-foreground'
                      }`}
                    >
                      Standard
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlanConfig({ ...planConfig, constructionPace: 'FAST' })}
                      className={`py-2 px-2 rounded-xl border text-center text-[11px] font-bold transition-all ${
                        planConfig.constructionPace === 'FAST'
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-white border-border text-muted-foreground'
                      }`}
                    >
                      Fast-Track
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic Live Estimate Card */}
            <div className="p-3.5 bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-emerald-50/50 border border-blue-200/60 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Estimated Timeline
                </p>
                <p className="text-sm font-extrabold text-foreground mt-0.5">
                  ~{previewCalculation.totalDays} Days <span className="text-xs font-medium text-muted-foreground">({previewCalculation.months} Months)</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Target Handover
                </p>
                <p className="text-sm font-extrabold text-[#2648E7] mt-0.5">
                  {previewCalculation.targetDateFormatted}
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleGenerate()}
                disabled={actionLoading === 'generate'}
                className="px-5 py-2.5 rounded-xl bg-[#2648E7] text-white text-xs font-bold hover:bg-[#1d38b8] shadow-md shadow-[#2648E7]/25 flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <Sparkles size={14} className={actionLoading === 'generate' ? 'animate-spin' : ''} />
                {actionLoading === 'generate' ? 'Calculating & Generating...' : 'Generate Milestone Plan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Data Quality Notice */}
      <div className="px-3 py-2 rounded-xl bg-muted/40 border border-border text-[10px] text-muted-foreground flex items-center gap-2">
        <Info size={12} className="shrink-0 text-blue-400" />
        Intelligence is generated from existing project data using deterministic rules. No external AI API is used.
        {(!data.milestonesExist || !data.hasBudget || !data.hasBoq) && (
          <span className="text-amber-600 font-medium ml-1">
            {!data.milestonesExist && 'No milestones. '}
            {!data.hasBudget && 'No budget. '}
            {!data.hasBoq && 'No QOM data. '}
            Some analyses show limited results.
          </span>
        )}
      </div>
    </div>
  );
}
