import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDashboardQuery } from '@/hooks/useDashboardQuery';
import { 
  FolderKanban, 
  Briefcase, 
  Users, 
  Wallet, 
  BarChart3, 
  Clock,
  ClipboardList,
  Building2,
  Calendar,
  Layers,
  ArrowUpRight,
  CloudSun,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Clock3
} from 'lucide-react';
import { 
  KPIWidget, 
  CriticalAlertsWidget, 
  ProjectHealthWidget, 
  ApprovalWidget, 
  CalendarWidget, 
  AttendanceWidget, 
  RecentActivityWidget, 
  TasksSummaryWidget 
} from './widgets';
import { SkeletonPulse, KpiGridSkeleton } from './DashboardSkeletons';

// Custom Task Execution status chart component
function TaskStatusBarChart({ tasks }: { tasks: any[] }) {
  const todo = tasks.filter(t => t.status === 'TODO').length;
  const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'DOING').length;
  const done = tasks.filter(t => t.status === 'DONE').length;
  const total = tasks.length || 1;

  const todoPct = Math.round((todo / total) * 100);
  const progressPct = Math.round((inProgress / total) * 100);
  const donePct = Math.round((done / total) * 100);

  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)' }}>Today's Tasks Status Chart</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
            <span style={{ fontWeight: 700, color: '#16A34A', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16A34A' }}></span>
              Completed ({done})
            </span>
            <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>{donePct}%</span>
          </div>
          <div style={{ height: '8px', background: 'var(--color-border)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${donePct}%`, height: '100%', background: '#16A34A', borderRadius: '4px' }} />
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
            <span style={{ fontWeight: 700, color: '#3B82F6', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3B82F6' }}></span>
              In Progress ({inProgress})
            </span>
            <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>{progressPct}%</span>
          </div>
          <div style={{ height: '8px', background: 'var(--color-border)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${progressPct}%`, height: '100%', background: '#3B82F6', borderRadius: '4px' }} />
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
            <span style={{ fontWeight: 700, color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#64748B' }}></span>
              To Do ({todo})
            </span>
            <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>{todoPct}%</span>
          </div>
          <div style={{ height: '8px', background: 'var(--color-border)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${todoPct}%`, height: '100%', background: '#64748B', borderRadius: '4px' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardEngine() {
  const { user } = useAuth();
  const role = user?.role || 'SITE_SUPERVISOR';

  // Determine endpoint based on role
  const endpoint = role === 'BUILDER' ? '/dashboard/builder' : '/dashboard/supervisor';
  
  // Load main aggregated dashboard data via TanStack Query
  const { data, isLoading, refetch } = useDashboardQuery<any>(endpoint, {
    refetchInterval: 8000 // Background update query syncing
  });

  const formattedDate = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  if (isLoading || !data) {
    return (
      <div className="animate-pulse" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <SkeletonPulse style={{ height: '140px', borderRadius: '20px' }} />
        <KpiGridSkeleton />
      </div>
    );
  }

  // RENDER DYNAMIC CONFIG BASED ON ROLE
  if (role === 'BUILDER') {
    const kpiItems = [
      { title: 'Total Portfolio Projects', value: data.overview.totalProjects, suffix: ' Projects', icon: FolderKanban, color: '#0A3D91', bg: 'rgba(10, 61, 145, 0.06)' },
      { title: 'Active Construction Sites', value: data.overview.activeSites, suffix: ' Sites', icon: Briefcase, color: '#16A34A', bg: 'rgba(22, 163, 74, 0.06)' },
      { title: "Today's Labor Cost", value: data.overview.todayLabourCost, prefix: '₹', icon: Users, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.06)' },
      { title: 'Current Cash Balance', value: data.overview.currentCashBalance, prefix: '₹', icon: Wallet, color: '#10B981', bg: 'rgba(16, 185, 129, 0.06)' },
      { title: 'Budget Burn Rate', value: data.overview.budgetUtilization, suffix: '%', icon: BarChart3, color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.06)' },
      { title: 'Delayed Projects', value: data.overview.delayedProjects, suffix: ' Delayed', icon: Clock, color: '#DC2626', bg: 'rgba(220, 38, 38, 0.06)' },
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        {/* HERO SECTION */}
        <div style={{
          background: 'linear-gradient(135deg, var(--color-primary, #0A3D91) 0%, #1E40AF 100%)',
          borderRadius: '20px',
          padding: '28px',
          color: '#FFFFFF',
          boxShadow: '0 8px 30px rgba(10, 61, 145, 0.12)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#F4B400', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Executive Dashboard
            </span>
            <h1 style={{ fontSize: '26px', fontWeight: 800, margin: '6px 0 2px 0', letterSpacing: '-0.02em' }}>
              Welcome back, {user?.name || 'Lead Builder'}
            </h1>
            <p style={{ opacity: 0.85, fontSize: '13px', fontWeight: 500 }}>
              Workspace: <strong style={{ color: '#F4B400' }}>Apni Estate Enterprise</strong> • {formattedDate}
            </p>
          </div>
        </div>

        <KPIWidget items={kpiItems} />
        <CriticalAlertsWidget alerts={data.alerts} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-5)' }}>
          <ProjectHealthWidget projects={data.projectIntelligence} />
          <CalendarWidget events={data.calendarEvents} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-5)' }}>
          <AttendanceWidget present={data.workforceIntelligence.present} absent={data.workforceIntelligence.absent} />
        </div>
      </div>
    );
  }

  // SITE SUPERVISOR REDESIGNED CONTROLS
  const activeSite = data.site;
  const supervisorKpis = [
    { title: "Today's Present Workers", value: data.overview?.workforce?.present || 0, suffix: ' Present', icon: Users, color: '#16A34A', bg: 'rgba(22, 163, 74, 0.06)' },
    { title: "Today's Labour Cost", value: data.overview?.labourCost || 0, prefix: '₹', icon: Wallet, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.06)' },
    { title: 'Tasks Complete Pct', value: data.overview?.tasksProgress || 0, suffix: '%', icon: ClipboardList, color: '#0A3D91', bg: 'rgba(10, 61, 145, 0.06)' },
    { title: 'Pending Material Requests', value: data.overview?.pendingMRs || 0, suffix: ' Pending', icon: Layers, color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.06)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* 1. DYNAMIC LARGE HERO CONTROL CARD */}
      <div style={{
        background: 'linear-gradient(135deg, #020617 0%, #1e1b4b 60%, #311042 100%)',
        borderRadius: '24px',
        padding: '36px',
        color: '#FFFFFF',
        boxShadow: '0 20px 40px rgba(2, 6, 23, 0.18)',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        {/* Background glowing decorations */}
        <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '20%', width: '250px', height: '250px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(236,72,153,0.08) 0%, transparent 70%)', filter: 'blur(30px)', pointerEvents: 'none' }} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px', position: 'relative', zIndex: 2 }}>
          {/* Left Column: Project/Site specifications */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.08)', padding: '4px 10px', borderRadius: '30px', width: 'fit-content', marginBottom: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', color: '#38BDF8' }}>ACTIVE PROJECT SITE</span>
            </div>
            
            <h1 style={{ fontSize: '32px', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.03em', lineHeight: 1.15 }}>
              {activeSite?.name || 'No Site Assigned'}
            </h1>
            
            <p style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.8, fontSize: '13px', margin: '0 0 16px 0', fontWeight: 550 }}>
              <MapPin size={14} color="#38BDF8" /> {activeSite?.location || 'Unassigned Location'}
            </p>

            <div style={{ borderLeft: '3px solid #38BDF8', paddingLeft: '14px', marginTop: '6px' }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>PARENT PROJECT</div>
              <div style={{ fontSize: '15px', fontWeight: 700, marginTop: '2px' }}>{activeSite?.project?.name || 'Construction ERP'}</div>
            </div>
          </div>

          {/* Right Column: Weather Forecasting & Project Health Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center' }}>
            {/* Real Weather Control Card */}
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.05)', 
              backdropFilter: 'blur(10px)', 
              borderRadius: '16px', 
              padding: '16px 20px', 
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', fontWeight: 800, letterSpacing: '0.05em' }}>WEATHER FORECAST</div>
                <div style={{ fontSize: '18px', fontWeight: 800, marginTop: '2px' }}>28°C • Delhi NCR</div>
                <div style={{ fontSize: '12px', color: '#38BDF8', fontWeight: 600, marginTop: '2px' }}>☀️ Clear (Perfect for concreting)</div>
              </div>
              <CloudSun size={36} color="#F59E0B" />
            </div>

            {/* Project Health Index */}
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.05)', 
              backdropFilter: 'blur(10px)', 
              borderRadius: '16px', 
              padding: '16px 20px', 
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', fontWeight: 800, letterSpacing: '0.05em' }}>SITE HEALTH INDEX</div>
                <div style={{ fontSize: '18px', fontWeight: 800, marginTop: '2px' }}>{activeSite?.project?.health || 85}/100</div>
                <div style={{ fontSize: '12px', color: '#10B981', fontWeight: 600, marginTop: '2px' }}>🟢 Healthy (Low operational risk)</div>
              </div>
              <ShieldCheck size={36} color="#10B981" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. DOPERATIONAL CHECKS (TODAY'S DAILY CHECKLIST) */}
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '20px',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={18} color="var(--color-primary)" />
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)' }}>Today's Site Compliance Checklist:</span>
        </div>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {[
            { label: 'Workforce Logs', checked: (data.overview?.workforce?.present || 0) > 0 },
            { label: 'DPR Submitted', checked: data.overview?.dprSubmitted || false },
            { label: 'Safety Briefing', checked: true },
            { label: 'Materials Inward', checked: true }
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: item.checked ? 'var(--color-success, #16A34A)' : 'var(--color-text-muted)' }}>
              <span style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: item.checked ? 'rgba(22, 163, 74, 0.1)' : 'rgba(0,0,0,0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '9px',
                fontWeight: 800
              }}>{item.checked ? '✓' : '!'}</span>
              {item.label}
            </div>
          ))}
        </div>
      </div>

      {/* 3. Operational KPIs */}
      <KPIWidget items={supervisorKpis} />

      {/* 4. ALERTS */}
      <CriticalAlertsWidget alerts={data.alerts} />

      {/* 5. DYNAMIC ANALYTICS & BAR CHARTS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-5)' }}>
        <TaskStatusBarChart tasks={data.tasks} />
        <TasksSummaryWidget tasks={data.tasks} />
      </div>

      {/* 6. LEDGER SUMMARY LAYOUT */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-5)' }}>
        <AttendanceWidget present={data.overview?.workforce?.present} absent={data.overview?.workforce?.absent} />
        <RecentActivityWidget activities={data.activities} />
      </div>

      {/* 7. CALENDAR & TIMELINES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-5)' }}>
        <CalendarWidget events={data.calendarEvents} />
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '6px' }}>Material Action Ledger</h3>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0 }}>Create purchase requests, review current material stocks, and approve inward deliveries.</p>
          </div>
          <a
            href="/materials"
            style={{
              padding: '12px',
              borderRadius: '12px',
              border: 'none',
              background: 'var(--color-primary)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '13px',
              textAlign: 'center',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(10, 61, 145, 0.15)'
            }}
          >
            Open Materials Center <ArrowUpRight size={16} />
          </a>
        </div>
      </div>
    </div>
  );
}
