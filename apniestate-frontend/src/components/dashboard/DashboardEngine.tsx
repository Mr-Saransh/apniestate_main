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
  ArrowUpRight
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

export default function DashboardEngine() {
  const { user } = useAuth();
  const role = user?.role || 'SITE_SUPERVISOR';

  // Determine endpoint based on role
  const endpoint = role === 'BUILDER' ? '/dashboard/builder' : '/dashboard/supervisor';
  
  // Load main aggregated dashboard data via TanStack Query
  const { data, isLoading, refetch } = useDashboardQuery<any>(endpoint, {
    refetchInterval: 8000 // Automatically refetch in background every 8s for live sync!
  });

  // Local state for approval tabs/resolutions
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const formattedDate = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // RENDER LOADING STATE
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
    // BUILDER KPIs MAP
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

        {/* 1. KPIs */}
        <KPIWidget items={kpiItems} />

        {/* 2. ALERTS */}
        <CriticalAlertsWidget alerts={data.alerts} />

        {/* 3. OPERATIONS GRID */}
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

  // SITE SUPERVISOR OR FALLBACK
  const activeSiteName = data.site?.name || 'No Assigned Site';
  const supervisorKpis = [
    { title: "Today's Present Workers", value: data.overview?.workforce?.present || 0, suffix: ' Present', icon: Users, color: '#16A34A', bg: 'rgba(22, 163, 74, 0.06)' },
    { title: "Today's Labour Cost", value: data.overview?.labourCost || 0, prefix: '₹', icon: Wallet, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.06)' },
    { title: 'Tasks Complete Pct', value: data.overview?.tasksProgress || 0, suffix: '%', icon: ClipboardList, color: '#0A3D91', bg: 'rgba(10, 61, 145, 0.06)' },
    { title: 'Pending Material Requests', value: data.overview?.pendingMRs || 0, suffix: ' Pending', icon: Layers, color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.06)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* HERO SECTION */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: '20px',
        padding: '28px',
        color: '#FFFFFF',
        boxShadow: '0 8px 30px rgba(15, 23, 42, 0.1)',
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
            Operational Control Center
          </span>
          <h1 style={{ fontSize: '26px', fontWeight: 800, margin: '6px 0 2px 0', letterSpacing: '-0.02em' }}>
            {activeSiteName}
          </h1>
          <p style={{ opacity: 0.85, fontSize: '13px', fontWeight: 500 }}>
            Supervisor: <strong style={{ color: '#F4B400' }}>{user?.name}</strong> • {formattedDate}
          </p>
        </div>
        {data.site && (
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '12px', padding: '8px 14px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '9px', opacity: 0.7, fontWeight: 700 }}>PROJECT PROGRESS</div>
            <div style={{ fontSize: '14px', fontWeight: 800 }}>{data.site.project.progress}% Complete</div>
          </div>
        )}
      </div>

      {/* 1. KPIs */}
      <KPIWidget items={supervisorKpis} />

      {/* 2. ALERTS */}
      <CriticalAlertsWidget alerts={data.alerts} />

      {/* 3. TASKS & CALENDAR */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-5)' }}>
        <TasksSummaryWidget tasks={data.tasks} />
        <CalendarWidget events={data.calendarEvents} />
      </div>

      {/* 4. ATTENDANCE & ACTIVITIES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-5)' }}>
        <AttendanceWidget present={data.overview?.workforce?.present} absent={data.overview?.workforce?.absent} />
        <RecentActivityWidget activities={data.activities} />
      </div>
    </div>
  );
}
