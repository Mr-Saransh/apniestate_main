import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  HeartPulse,
  TrendingUp,
  ShoppingCart,
  Wallet,
  Calendar,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Info
} from 'lucide-react';

export interface ProjectHealthData {
  project?: {
    id?: string;
    name?: string;
    budget?: number | null;
    actual_cost?: number | null;
    progress_percentage?: number;
    start_date?: string;
    end_date?: string | null;
    status?: string;
  };
  todaySummary?: {
    labourCount?: number;
    labourCost?: number;
    todayExpense?: number;
    pendingMaterialRequests?: number;
    pendingVendorPayments?: number;
    pendingVendorPaymentAmount?: number;
    materialsReceivedToday?: number;
    equipmentRunning?: number;
  };
  projectIntelligence?: {
    budget?: number;
    actualSpend?: number;
    remainingBudget?: number;
    todayLabourCost?: number;
    pendingPaymentExposure?: number;
    pendingPaymentCount?: number;
    lowStockCount?: number;
    lowStockItems?: { name: string; unit: string; quantity: number; minQuantity: number; site: string }[];
    procurementDelayCount?: number;
    overdueMilestoneCount?: number;
    overdueMilestones?: { name: string; targetDate: string }[];
    materialVariances?: { id: string; name: string; unit: string; planned: number; used: number; remaining: number; percentUsed: number }[];
  };
  alerts?: { type: string; message: string; link: string; severity: string }[];
  progress?: {
    completionPercent?: number;
    totalMilestones?: number;
    completedMilestones?: number;
    currentMilestone?: { name: string; targetDate: string; status: string } | null;
    nextMilestone?: { name: string; targetDate: string } | null;
    recentDpr?: { date: string; summary: string; site: string } | null;
  };
}

interface FactorHealth {
  id: string;
  title: string;
  pageName: string;
  link: string;
  icon: React.ReactNode;
  score: number; // 0 - 100
  status: 'OPTIMAL' | 'WATCH' | 'CRITICAL';
  statusLabel: string;
  summary: string;
  metrics: { label: string; value: string; isWarning?: boolean }[];
  badgeColor: string;
}

function formatSmartCurrency(val: number | null | undefined): string {
  if (!val || val === 0) return '₹0';
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
  return `₹${Math.round(val).toLocaleString('en-IN')}`;
}

export default function SmartProjectHealth({
  data,
  className = "",
  initiallyExpanded = true
}: {
  data: ProjectHealthData | null;
  className?: string;
  initiallyExpanded?: boolean;
}) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(initiallyExpanded);

  if (!data) return null;

  const project = data.project;
  const summary = data.todaySummary;
  const intel = data.projectIntelligence;
  const progress = data.progress;
  const alerts = data.alerts || [];

  // =========================================================================
  // 1. FACTOR: FINANCE & BUDGET (/finance)
  // =========================================================================
  const totalBudget = intel?.budget || project?.budget || 0;
  const actualSpend = intel?.actualSpend || project?.actual_cost || 0;
  const paymentExposure = intel?.pendingPaymentExposure ?? (summary?.pendingVendorPaymentAmount || 0);
  const pendingPaymentsCount = intel?.pendingPaymentCount ?? (summary?.pendingVendorPayments || 0);
  
  let budgetUtilizedPct = totalBudget > 0 ? (actualSpend / totalBudget) * 100 : 0;
  let financeScore = 100;
  let financeStatus: 'OPTIMAL' | 'WATCH' | 'CRITICAL' = 'OPTIMAL';
  let financeStatusLabel = 'Budget Healthy';
  let financeSummary = 'Expenditure tracking within allocated limits.';

  if (totalBudget > 0) {
    if (budgetUtilizedPct > 100) {
      financeScore = Math.max(25, 60 - Math.round(budgetUtilizedPct - 100));
      financeStatus = 'CRITICAL';
      financeStatusLabel = 'Budget Overrun';
      financeSummary = `Actual spend exceeds overall budget by ${(budgetUtilizedPct - 100).toFixed(1)}%.`;
    } else if (budgetUtilizedPct > 90) {
      financeScore = 68;
      financeStatus = 'WATCH';
      financeStatusLabel = 'Near Budget Limit';
      financeSummary = `90%+ budget utilized (${budgetUtilizedPct.toFixed(1)}%). Re-budgeting advised.`;
    } else if (budgetUtilizedPct > 75 && (progress?.completionPercent || 0) < 50) {
      financeScore = 72;
      financeStatus = 'WATCH';
      financeStatusLabel = 'Spend vs Progress Gap';
      financeSummary = `High budget utilization (${budgetUtilizedPct.toFixed(0)}%) relative to project completion (${progress?.completionPercent || 0}%).`;
    }
  }

  if (paymentExposure > 200000 || pendingPaymentsCount > 5) {
    financeScore = Math.max(30, financeScore - 15);
    if (financeStatus === 'OPTIMAL') {
      financeStatus = 'WATCH';
      financeStatusLabel = 'Payment Due Watch';
      financeSummary = `Elevated vendor payment exposure (₹${paymentExposure.toLocaleString('en-IN')}).`;
    }
  }

  const financeFactor: FactorHealth = {
    id: 'finance',
    title: 'Finance & Budget',
    pageName: 'Finance Workspace',
    link: '/finance',
    icon: <Wallet size={16} className="text-emerald-600" />,
    score: financeScore,
    status: financeStatus,
    statusLabel: financeStatusLabel,
    summary: financeSummary,
    badgeColor: financeStatus === 'OPTIMAL' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : financeStatus === 'WATCH' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-200',
    metrics: [
      { label: 'Utilization', value: totalBudget > 0 ? `${budgetUtilizedPct.toFixed(0)}%` : 'No Budget', isWarning: budgetUtilizedPct > 90 },
      { label: 'Remaining', value: formatSmartCurrency(Math.max(0, totalBudget - actualSpend)) },
      { label: 'Exposure', value: formatSmartCurrency(paymentExposure), isWarning: paymentExposure > 100000 }
    ]
  };

  // =========================================================================
  // 2. FACTOR: PROCUREMENT & MATERIALS (/purchase)
  // =========================================================================
  const lowStockCount = intel?.lowStockCount || 0;
  const delayedPoCount = intel?.procurementDelayCount || 0;
  const pendingRequests = summary?.pendingMaterialRequests || 0;
  const overusedVariances = (intel?.materialVariances || []).filter(v => v.percentUsed > 100);

  let procurementScore = 100;
  let procurementStatus: 'OPTIMAL' | 'WATCH' | 'CRITICAL' = 'OPTIMAL';
  let procurementStatusLabel = 'Supply Chain Stable';
  let procurementSummary = 'Inventory levels and purchase orders in equilibrium.';

  if (delayedPoCount > 0 || lowStockCount > 0 || overusedVariances.length > 0) {
    const penalty = (delayedPoCount * 18) + (lowStockCount * 12) + (overusedVariances.length * 10) + (pendingRequests > 3 ? 10 : 0);
    procurementScore = Math.max(35, 100 - penalty);

    if (delayedPoCount > 2 || lowStockCount > 3 || overusedVariances.length > 2) {
      procurementStatus = 'CRITICAL';
      procurementStatusLabel = 'Supply Risk';
      procurementSummary = `${delayedPoCount > 0 ? `${delayedPoCount} POs delayed. ` : ''}${lowStockCount > 0 ? `${lowStockCount} items below threshold.` : ''}`;
    } else {
      procurementStatus = 'WATCH';
      procurementStatusLabel = 'Attention Needed';
      procurementSummary = `${delayedPoCount > 0 ? `${delayedPoCount} order(s) past ETA. ` : ''}${lowStockCount > 0 ? `${lowStockCount} low stock alert(s).` : 'Review pending requirements.'}`;
    }
  }

  const procurementFactor: FactorHealth = {
    id: 'procurement',
    title: 'Procurement & Materials',
    pageName: 'Purchase Workspace',
    link: '/purchase',
    icon: <ShoppingCart size={16} className="text-orange-600" />,
    score: procurementScore,
    status: procurementStatus,
    statusLabel: procurementStatusLabel,
    summary: procurementSummary,
    badgeColor: procurementStatus === 'OPTIMAL' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : procurementStatus === 'WATCH' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-200',
    metrics: [
      { label: 'Low Stock', value: `${lowStockCount} items`, isWarning: lowStockCount > 0 },
      { label: 'Delayed POs', value: `${delayedPoCount} orders`, isWarning: delayedPoCount > 0 },
      { label: 'Pending Req', value: `${pendingRequests} requests`, isWarning: pendingRequests > 3 }
    ]
  };

  // =========================================================================
  // 3. FACTOR: SCHEDULE & PROGRESS (/progress)
  // =========================================================================
  const overdueMilestoneCount = intel?.overdueMilestoneCount || 0;
  const completedMilestones = progress?.completedMilestones || 0;
  const totalMilestones = progress?.totalMilestones || 0;
  const nextMilestone = progress?.nextMilestone;
  
  let daysToNext = 999;
  if (nextMilestone?.targetDate) {
    daysToNext = Math.ceil((new Date(nextMilestone.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }

  let scheduleScore = 100;
  let scheduleStatus: 'OPTIMAL' | 'WATCH' | 'CRITICAL' = 'OPTIMAL';
  let scheduleStatusLabel = 'Schedule On Track';
  let scheduleSummary = 'Execution timeline aligned with milestone dates.';

  if (overdueMilestoneCount > 0) {
    scheduleScore = Math.max(30, 80 - (overdueMilestoneCount * 20));
    scheduleStatus = 'CRITICAL';
    scheduleStatusLabel = `${overdueMilestoneCount} Overdue Milestone${overdueMilestoneCount > 1 ? 's' : ''}`;
    scheduleSummary = `Milestone delivery breached. Remedial scheduling needed.`;
  } else if (daysToNext <= 3 && daysToNext >= 0) {
    scheduleScore = 78;
    scheduleStatus = 'WATCH';
    scheduleStatusLabel = 'Milestone Due Soon';
    scheduleSummary = `"${nextMilestone?.name || 'Milestone'}" target date in ${daysToNext} day${daysToNext === 1 ? '' : 's'}.`;
  }

  const scheduleFactor: FactorHealth = {
    id: 'schedule',
    title: 'Schedule & Milestones',
    pageName: 'Progress Workspace',
    link: '/progress?tab=timeline',
    icon: <Calendar size={16} className="text-blue-600" />,
    score: scheduleScore,
    status: scheduleStatus,
    statusLabel: scheduleStatusLabel,
    summary: scheduleSummary,
    badgeColor: scheduleStatus === 'OPTIMAL' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : scheduleStatus === 'WATCH' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-200',
    metrics: [
      { label: 'Milestones', value: totalMilestones > 0 ? `${completedMilestones}/${totalMilestones} done` : 'None Defined' },
      { label: 'Overdue', value: `${overdueMilestoneCount}`, isWarning: overdueMilestoneCount > 0 },
      { label: 'Next Target', value: nextMilestone ? `${daysToNext >= 0 ? `${daysToNext}d left` : 'Overdue'}` : 'All complete' }
    ]
  };

  // =========================================================================
  // 4. FACTOR: OPERATIONS & SITE WORKFORCE (/operations)
  // =========================================================================
  const labourCount = summary?.labourCount || 0;
  const recentDpr = progress?.recentDpr;
  const equipmentRunning = summary?.equipmentRunning || 0;
  const hasNoDprAlert = alerts.some(a => a.type === 'NO_DPR');

  let opsScore = 100;
  let opsStatus: 'OPTIMAL' | 'WATCH' | 'CRITICAL' = 'OPTIMAL';
  let opsStatusLabel = 'Site Active & Reporting';
  let opsSummary = 'Labour presence confirmed and site reports logged.';

  if (labourCount === 0) {
    opsScore = 65;
    opsStatus = 'WATCH';
    opsStatusLabel = 'Zero Attendance Logged';
    opsSummary = 'No worker attendance recorded today. Confirm site activity.';
  } else if (hasNoDprAlert) {
    opsScore = 80;
    opsStatus = 'WATCH';
    opsStatusLabel = 'DPR Pending Today';
    opsSummary = 'Daily Progress Report has not been filed yet for active sites.';
  }

  const opsFactor: FactorHealth = {
    id: 'operations',
    title: 'Operations & Site Workforce',
    pageName: 'Operations Workspace',
    link: '/operations?tab=labour',
    icon: <Users size={16} className="text-purple-600" />,
    score: opsScore,
    status: opsStatus,
    statusLabel: opsStatusLabel,
    summary: opsSummary,
    badgeColor: opsStatus === 'OPTIMAL' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : opsStatus === 'WATCH' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-200',
    metrics: [
      { label: 'Workers', value: `${labourCount} logged`, isWarning: labourCount === 0 },
      { label: 'DPR Report', value: recentDpr ? 'Active' : 'Missing', isWarning: !recentDpr },
      { label: 'Equipment', value: `${equipmentRunning} running` }
    ]
  };

  // =========================================================================
  // 5. COMPOSITE OVERALL HEALTH SCORE (Weighted Average)
  // =========================================================================
  const factors = [financeFactor, procurementFactor, scheduleFactor, opsFactor];
  const compositeScore = Math.round(
    (financeScore * 0.28) + 
    (procurementScore * 0.28) + 
    (scheduleScore * 0.24) + 
    (opsScore * 0.20)
  );

  let overallRating: 'EXCELLENT' | 'STABLE' | 'NEEDS_ATTENTION' | 'CRITICAL' = 'STABLE';
  let ratingLabel = 'Optimal Health';
  let ratingTheme = {
    textColor: 'text-emerald-700',
    bgColor: 'bg-emerald-500',
    softBg: 'bg-emerald-50/80',
    borderColor: 'border-emerald-200',
    badgeBg: 'bg-emerald-100 text-emerald-800',
    progressColor: '#10b981'
  };

  if (compositeScore >= 90) {
    overallRating = 'EXCELLENT';
    ratingLabel = 'Prime Condition';
    ratingTheme = {
      textColor: 'text-emerald-700',
      bgColor: 'bg-emerald-500',
      softBg: 'bg-emerald-50/80',
      borderColor: 'border-emerald-200',
      badgeBg: 'bg-emerald-100 text-emerald-800',
      progressColor: '#10b981'
    };
  } else if (compositeScore >= 75) {
    overallRating = 'STABLE';
    ratingLabel = 'Stable Health';
    ratingTheme = {
      textColor: 'text-[#2648E7]',
      bgColor: 'bg-[#2648E7]',
      softBg: 'bg-blue-50/70',
      borderColor: 'border-blue-200',
      badgeBg: 'bg-blue-100 text-blue-900',
      progressColor: '#2648E7'
    };
  } else if (compositeScore >= 60) {
    overallRating = 'NEEDS_ATTENTION';
    ratingLabel = 'Moderate Friction';
    ratingTheme = {
      textColor: 'text-amber-700',
      bgColor: 'bg-amber-500',
      softBg: 'bg-amber-50/80',
      borderColor: 'border-amber-200',
      badgeBg: 'bg-amber-100 text-amber-900',
      progressColor: '#f59e0b'
    };
  } else {
    overallRating = 'CRITICAL';
    ratingLabel = 'Critical Attention Required';
    ratingTheme = {
      textColor: 'text-rose-700',
      bgColor: 'bg-rose-500',
      softBg: 'bg-rose-50/80',
      borderColor: 'border-rose-200',
      badgeBg: 'bg-rose-100 text-rose-900',
      progressColor: '#ef4444'
    };
  }

  // Generate top recommendation / smart insight
  const criticalFactors = factors.filter(f => f.status === 'CRITICAL');
  const watchFactors = factors.filter(f => f.status === 'WATCH');

  let recommendationText = 'All site domains are operating within designated project thresholds.';
  if (criticalFactors.length > 0) {
    recommendationText = `Critical risk detected in ${criticalFactors.map(f => f.title).join(' and ')}. Immediate review required.`;
  } else if (watchFactors.length > 0) {
    recommendationText = `Active watchpoints detected in ${watchFactors.map(f => f.title).join(', ')}. Action recommended to avoid project slippage.`;
  }

  return (
    <div className={`bg-white rounded-2xl border border-border shadow-sm overflow-hidden transition-all duration-300 ${className}`}>
      {/* Header bar: Executive Project Health Index */}
      <div className="p-4 sm:p-5 border-b border-border/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${ratingTheme.softBg} ${ratingTheme.textColor}`}>
              <HeartPulse size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-foreground tracking-tight">
                  Project Health Intelligence
                </h3>
                <span className={`text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full border ${ratingTheme.badgeBg}`}>
                  {ratingLabel}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Real-time cross-functional evaluation across Procurement, Finance, Schedule & Site Operations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* Health Score Pill */}
            <div className="flex items-baseline gap-1 bg-muted/50 border border-border px-3 py-1.5 rounded-xl">
              <span className={`text-xl font-extrabold ${ratingTheme.textColor}`}>
                {compositeScore}
              </span>
              <span className="text-[11px] text-muted-foreground font-semibold">/100</span>
            </div>

            {/* Expand / Collapse toggle */}
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
            >
              <span>{expanded ? 'Collapse' : 'Inspect'}</span>
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {/* Global Progress Line */}
        <div className="mt-3.5 space-y-1.5">
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex">
            <div
              className={`h-full transition-all duration-700 ease-out ${ratingTheme.bgColor}`}
              style={{ width: `${compositeScore}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground font-medium">
            <span>Critical (&lt;60)</span>
            <span>Watch (60-74)</span>
            <span>Stable (75-89)</span>
            <span>Optimal (90-100)</span>
          </div>
        </div>

        {/* Dynamic AI-Style Synthesis Banner */}
        <div className={`mt-3 px-3 py-2 rounded-xl text-xs flex items-center gap-2 border ${ratingTheme.softBg} ${ratingTheme.borderColor}`}>
          <Sparkles size={14} className={`${ratingTheme.textColor} shrink-0`} />
          <span className="text-foreground text-[11px] font-medium leading-relaxed">
            <strong className={ratingTheme.textColor}>Diagnostic Insight:</strong> {recommendationText}
          </span>
        </div>
      </div>

      {/* Expandable Breakdown of All Factors & Direct Workspace Links */}
      {expanded && (
        <div className="p-4 sm:p-5 bg-muted/20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Departmental Health Diagnostics
            </span>
            <span className="text-[11px] text-muted-foreground">
              Click any factor card to jump to that workspace
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {factors.map((factor) => (
              <div
                key={factor.id}
                onClick={() => navigate(factor.link)}
                className="bg-white border border-border hover:border-[#2648E7]/40 rounded-xl p-3.5 shadow-2xs hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="size-7 rounded-lg bg-muted/60 flex items-center justify-center shrink-0">
                        {factor.icon}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-foreground group-hover:text-[#2648E7] transition-colors flex items-center gap-1">
                          {factor.title}
                          <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#2648E7]" />
                        </h4>
                        <span className="text-[10px] text-muted-foreground">
                          {factor.pageName}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${factor.badgeColor}`}>
                        {factor.statusLabel}
                      </span>
                      <span className="text-xs font-bold text-foreground">
                        {factor.score}<span className="text-[10px] text-muted-foreground font-normal">/100</span>
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground mb-3 leading-snug">
                    {factor.summary}
                  </p>
                </div>

                {/* Metrics strip */}
                <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-border/60">
                  {factor.metrics.map((m, idx) => (
                    <div key={idx} className="bg-muted/40 rounded-lg p-1.5 text-center">
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground block truncate">
                        {m.label}
                      </span>
                      <span className={`text-[11px] font-bold block truncate ${m.isWarning ? 'text-rose-600 font-extrabold' : 'text-foreground'}`}>
                        {m.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-1 flex items-center justify-between text-[11px] text-muted-foreground px-1">
            <span className="flex items-center gap-1.5">
              <Info size={13} className="text-blue-600" />
              Factors update dynamically with site logs, PO deliveries, bill clearances, and BOQ material issuances.
            </span>
            <button
              onClick={() => navigate('/progress?tab=timeline')}
              className="text-[#2648E7] font-bold hover:underline shrink-0 ml-2"
            >
              View Full Gantt Timeline →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
