import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDashboardQuery } from '@/hooks/useDashboardQuery';
import {
  FolderKanban,
  ClipboardList,
  Calendar,
  AlertTriangle,
  Users,
  Truck,
  TrendingUp,
  Activity,
  Layers,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import {
  KPIWidget,
  CalendarWidget,
  TimelineWidget,
  EmptyStateWidget,
  RecentActivityWidget,
  ProgressRingCard
} from './widgets';
import {
  AreaChartWidget,
  BarChartWidget,
  DonutChartWidget,
  LineChartWidget,
  ProgressRingWidget
} from '@/components/charts/ChartComponents';
import { KpiGridSkeleton } from './DashboardSkeletons';

export default function ProjectManagerDashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useDashboardQuery<any>('/dashboard/pm', {
    refetchInterval: 10000
  });

  const formattedDate = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  if (isLoading || !data) {
    return <KpiGridSkeleton />;
  }

  const kpis = [
    { title: 'Managed Projects', value: data.overview.totalProjects || 0, suffix: ' Active', icon: FolderKanban, color: '#3B82F6', bg: 'rgba(59, 132, 246, 0.06)' },
    { title: 'Supervised Sites', value: data.overview.activeSites || 0, suffix: ' Sites', icon: Layers, color: '#10B981', bg: 'rgba(16, 185, 129, 0.06)' },
    { title: 'Total Tasks Assigned', value: data.overview.totalTasks || 0, icon: ClipboardList, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.06)' },
    { title: 'Overdue Site Tasks', value: data.overview.overdueTasks || 0, icon: AlertTriangle, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.06)' },
    { title: 'Total Team Crew', value: data.overview.totalWorkers || 0, suffix: ' Crew', icon: Users, color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.06)' },
    { title: 'Tasks Completed', value: data.overview.completedTasks || 0, icon: Activity, color: '#EC4899', bg: 'rgba(236, 72, 153, 0.06)' },
  ];

  const taskData = [
    { name: 'To Do', value: data.taskBreakdown.todo },
    { name: 'In Progress', value: data.taskBreakdown.inProgress },
    { name: 'Completed', value: data.taskBreakdown.done },
    { name: 'Blocked', value: data.taskBreakdown.blocked }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* 1. DYNAMIC LARGE HERO CONTROL CARD (PRESERVED) */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #0d9488 100%)',
        borderRadius: '20px',
        padding: '28px',
        color: '#FFFFFF',
        boxShadow: '0 8px 30px rgba(13, 148, 136, 0.12)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#2dd4bf', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Project Manager Dashboard
          </span>
          <h1 style={{ color: '#FFFFFF', fontSize: '26px', fontWeight: 800, margin: '6px 0 2px 0', letterSpacing: '-0.02em' }}>
            Welcome back, {user?.name || 'Project Manager'}
          </h1>
          <p style={{ opacity: 0.85, fontSize: '13px', fontWeight: 500 }}>
            Workspace: <strong style={{ color: '#2dd4bf' }}>Apni Estate Enterprise</strong> • {formattedDate}
          </p>
        </div>
      </div>

      {/* KPI Stats Block */}
      <KPIWidget items={kpis} />

      {/* 2. Interactive Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-5)' }}>
        {/* Weekly Task Progress Area Chart */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} color="#10B981" />
            Weekly Activity Progress (Completed Tasks)
          </h3>
          <AreaChartWidget data={data.weeklyProgress} xKey="day" dataKeys={['completed']} colors={['#10B981']} />
        </div>

        {/* Task Breakdown Donut Chart */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClipboardList size={18} color="#F59E0B" />
            Active Tasks Status Breakdown
          </h3>
          <DonutChartWidget data={taskData} colors={['#64748B', '#3B82F6', '#10B981', '#EF4444']} />
        </div>
      </div>

      {/* Project Timelines (Gantt Summary) and Upcoming Milestones */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-5)' }}>
        {/* Project progress and dates */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderKanban size={18} color="#3B82F6" />
            Project Gantt & Milestone Summary
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {data.projectTimelines.map((proj: any) => (
              <div key={proj.id} style={{ padding: '14px', border: '1px solid var(--color-border)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 4px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{proj.name}</h4>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    {proj.startDate ? new Date(proj.startDate).toLocaleDateString() : 'TBD'} - {proj.endDate ? new Date(proj.endDate).toLocaleDateString() : 'TBD'}
                  </span>
                </div>
                <ProgressRingWidget percentage={proj.progress} size={48} strokeWidth={4} color="#3B82F6" />
              </div>
            ))}
          </div>
        </div>

        {/* Milestone Timeline */}
        <TimelineWidget events={data.milestoneProgress} title="Detailed Milestone Progress Tracker" />
      </div>

      {/* Resource distribution and risks */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-5)' }}>
        {/* Worker Trade Allocation */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} color="#8B5CF6" />
            Labour Allocation by Specialization
          </h3>
          {data.teamAllocation.length === 0 ? (
            <EmptyStateWidget title="No Crew" message="No workforce personnel allocated to active sites." />
          ) : (
            <BarChartWidget data={data.teamAllocation} xKey="trade" dataKeys={['count']} colors={['#8B5CF6']} />
          )}
        </div>

        {/* Project Risk Widget */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} color="#EF4444" />
            Critical Risk & Delay Register
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data.risks.length === 0 ? (
              <EmptyStateWidget title="Zero Risks" message="All operations currently flagged as low risk." />
            ) : (
              data.risks.map((risk: any) => (
                <div key={risk.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', border: '1px solid var(--color-border)', borderRadius: '12px', borderColor: risk.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.2)' : 'var(--color-border)' }}>
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: risk.severity === 'CRITICAL' ? '#EF4444' : 'var(--color-text)' }}>{risk.title}</span>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Project: {risk.projectName}</div>
                  </div>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '3px 6px',
                    borderRadius: '4px',
                    background: risk.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                    color: risk.severity === 'CRITICAL' ? '#EF4444' : '#F59E0B'
                  }}>{risk.severity}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Deliveries & Activities */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-5)' }}>
        {/* Deliveries */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Truck size={18} color="#3B82F6" />
            Upcoming Supplier PO Deliveries
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data.upcomingDeliveries.length === 0 ? (
              <EmptyStateWidget title="No Deliveries" message="No upcoming PO delivery dates scheduled." />
            ) : (
              data.upcomingDeliveries.map((del: any) => (
                <div key={del.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', border: '1px solid var(--color-border)', borderRadius: '12px' }}>
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>PO: {del.poNumber}</span>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Vendor: {del.vendor} • Date: {new Date(del.deliveryDate).toLocaleDateString()}</div>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text)' }}>₹{del.amount?.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <RecentActivityWidget activities={data.recentActivities} />
      </div>
    </div>
  );
}
