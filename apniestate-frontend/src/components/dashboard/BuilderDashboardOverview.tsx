import React from 'react';
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
  AlertTriangle,
  TrendingUp,
  Boxes,
  Activity,
  ArrowUpRight,
  TrendingDown,
  ThumbsUp,
  FileCheck
} from 'lucide-react';
import {
  KPIWidget,
  CriticalAlertsWidget,
  ProjectHealthWidget,
  CalendarWidget,
  AttendanceWidget,
  RecentActivityWidget,
  TimelineWidget,
  MiniChartCard,
  ProgressRingCard,
  EmptyStateWidget
} from './widgets';
import {
  AreaChartWidget,
  BarChartWidget,
  DonutChartWidget,
  LineChartWidget
} from '@/components/charts/ChartComponents';
import { KpiGridSkeleton } from './DashboardSkeletons';

export const BuilderDashboardOverview: React.FC = () => {
  const { user } = useAuth();
  const { data, isLoading } = useDashboardQuery<any>('/dashboard/builder', {
    refetchInterval: 12000
  });

  if (isLoading || !data) {
    return <KpiGridSkeleton />;
  }

  const kpis = [
    { title: 'Total Portfolio Projects', value: data.overview.totalProjects || 0, suffix: ' Projects', icon: FolderKanban, color: '#3B82F6', bg: 'rgba(59, 132, 246, 0.06)' },
    { title: 'Active Construction Sites', value: data.overview.activeSites || 0, suffix: ' Sites', icon: Briefcase, color: '#10B981', bg: 'rgba(16, 185, 129, 0.06)' },
    { title: "Today's Labor Cost", value: data.overview.todayLabourCost || 0, prefix: '₹', icon: Users, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.06)' },
    { title: 'Current Cash Balance', value: data.overview.currentCashBalance || 0, prefix: '₹', icon: Wallet, color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.06)' },
    { title: 'Budget Burn Rate', value: data.overview.budgetUtilization || 0, suffix: '%', icon: BarChart3, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.06)' },
    { title: 'Delayed Projects', value: data.overview.delayedProjects || 0, suffix: ' Delayed', icon: Clock, color: '#EC4899', bg: 'rgba(236, 72, 153, 0.06)' },
  ];

  // Portfolio health distribution chart
  const activeCount = data.projectIntelligence?.filter((p: any) => p.status === 'ACTIVE').length || 0;
  const planningCount = data.projectIntelligence?.filter((p: any) => p.status === 'PLANNING').length || 0;
  const completedCount = data.projectIntelligence?.filter((p: any) => p.status === 'COMPLETED').length || 0;
  const holdCount = data.projectIntelligence?.filter((p: any) => p.status === 'ON_HOLD').length || 0;

  const healthData = [
    { name: 'Active', value: activeCount },
    { name: 'Planning', value: planningCount },
    { name: 'Completed', value: completedCount },
    { name: 'On Hold', value: holdCount }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* KPI Stats Block */}
      <KPIWidget items={kpis} />

      {/* Critical Alerts Block */}
      <CriticalAlertsWidget alerts={data.alerts} />

      {/* Interactive Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-5)' }}>
        {/* Revenue & Expenses Trend Area Chart */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} color="#3B82F6" />
            Revenue & Expense Monthly Trend
          </h3>
          <AreaChartWidget data={data.revenueTrend} xKey="month" dataKeys={['revenue', 'expenses']} colors={['#10B981', '#EF4444']} />
        </div>

        {/* Budget Burn Rate Bar Chart */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={18} color="#F59E0B" />
            Project Budget Burn Breakdown
          </h3>
          <BarChartWidget data={data.budgetBurn} xKey="projectName" dataKeys={['allocated', 'spent']} colors={['#3B82F6', '#EF4444']} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-5)' }}>
        {/* Portfolio Health Donut Chart */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color="#8B5CF6" />
            Portfolio Project Distribution
          </h3>
          <DonutChartWidget data={healthData} colors={['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B']} />
        </div>

        {/* Upcoming Milestones */}
        <TimelineWidget events={data.upcomingMilestones} title="Upcoming Project Milestones" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-5)' }}>
        <ProjectHealthWidget projects={data.projectIntelligence} />

        {/* Approval Center */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClipboardList size={18} color="#EF4444" />
            Pending Approval Action Center
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <ProgressRingCard title="Expense Vouchers" percentage={data.approvalsPending.expenses > 0 ? 35 : 100} color="#F59E0B" subtitle={`${data.approvalsPending.expenses} pending`} />
            <ProgressRingCard title="Leave Requests" percentage={data.approvalsPending.leaves > 0 ? 50 : 100} color="#3B82F6" subtitle={`${data.approvalsPending.leaves} pending`} />
          </div>
          <a
            href="/settings"
            style={{
              padding: '12px',
              borderRadius: '12px',
              background: 'rgba(59, 130, 246, 0.08)',
              color: '#3B82F6',
              fontWeight: 700,
              fontSize: '13px',
              textAlign: 'center',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            Review Approval Ledger <ArrowUpRight size={16} />
          </a>
        </div>
      </div>

      {/* Labor trends and material shortages */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-5)' }}>
        {/* Labour Trend line chart */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} color="#10B981" />
            Labour Trend (Last 7 Days)
          </h3>
          <LineChartWidget data={data.labourTrend} xKey="date" dataKeys={['workers']} colors={['#10B981']} />
        </div>

        {/* Material Shortages */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Boxes size={18} color="#EF4444" />
            Critical Material Shortages
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data.materialShortages.length === 0 ? (
              <EmptyStateWidget title="No Shortages" message="All active sites have adequate material stock levels." />
            ) : (
              data.materialShortages.map((item: any, idx: number) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', border: '1px solid var(--color-border)', borderRadius: '12px' }}>
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>{item.name}</span>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Site: {item.siteName}</div>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#EF4444' }}>
                    {item.quantity} / {item.minQuantity} {item.unit}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Calendar & Activities footer */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-5)' }}>
        <CalendarWidget events={data.calendarEvents} />
        <RecentActivityWidget activities={data.financialIntelligence?.recentExpenses.map((e: any) => ({
          id: e.id,
          details: `${e.category} voucher for ₹${e.amount.toLocaleString()} was ${e.status.toLowerCase()}`,
          timestamp: e.date,
          userName: 'Finance'
        }))} />
      </div>
    </div>
  );
};
