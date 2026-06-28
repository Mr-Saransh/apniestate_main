import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDashboardQuery } from '@/hooks/useDashboardQuery';
import {
  Wallet,
  Receipt,
  CreditCard,
  BarChart3,
  TrendingUp,
  Truck,
  Activity,
  Calculator,
  AlertCircle,
  FileCheck,
  ArrowUpRight
} from 'lucide-react';
import {
  KPIWidget,
  RecentActivityWidget,
  EmptyStateWidget
} from './widgets';
import {
  AreaChartWidget,
  BarChartWidget,
  DonutChartWidget,
  ProgressRingWidget
} from '@/components/charts/ChartComponents';
import { KpiGridSkeleton } from './DashboardSkeletons';

export default function AccountantDashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useDashboardQuery<any>('/dashboard/accountant', {
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
    { title: 'Audited Expenses', value: data.overview.totalExpenses || 0, prefix: '₹', icon: Wallet, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.06)' },
    { title: 'Total Inflow (Credits)', value: data.overview.totalRevenue || 0, prefix: '₹', icon: TrendingUp, color: '#10B981', bg: 'rgba(16, 185, 129, 0.06)' },
    { title: 'Petty Cash Balance', value: data.overview.cashBalance || 0, prefix: '₹', icon: Receipt, color: '#3B82F6', bg: 'rgba(59, 132, 246, 0.06)' },
    { title: 'Pending Vendor Bills', value: data.overview.pendingInvoices || 0, prefix: '₹', icon: CreditCard, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.06)' },
    { title: 'Unreleased Payments', value: data.overview.pendingPayments || 0, prefix: '₹', icon: Calculator, color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.06)' },
    { title: 'Overall Budget Used', value: data.overview.budgetUtilization || 0, suffix: '%', icon: BarChart3, color: '#EC4899', bg: 'rgba(236, 72, 153, 0.06)' },
  ];

  const invoiceData = [
    { name: 'Draft', value: data.invoiceBreakdown.draft || 0 },
    { name: 'Sent', value: data.invoiceBreakdown.sent || 0 },
    { name: 'Paid', value: data.invoiceBreakdown.paid || 0 },
    { name: 'Overdue', value: data.invoiceBreakdown.overdue || 0 }
  ];

  const poData = [
    { name: 'Draft', value: data.purchaseOrderBreakdown.draft || 0 },
    { name: 'Pending', value: data.purchaseOrderBreakdown.pending || 0 },
    { name: 'Approved', value: data.purchaseOrderBreakdown.approved || 0 },
    { name: 'Delivered', value: data.purchaseOrderBreakdown.delivered || 0 }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* 1. DYNAMIC LARGE HERO CONTROL CARD (PRESERVED) */}
      <div style={{
        background: 'linear-gradient(135deg, #111827 0%, #374151 100%)',
        borderRadius: '20px',
        padding: '28px',
        color: '#FFFFFF',
        boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
        border: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Accountant Dashboard
          </span>
          <h1 style={{ color: '#FFFFFF', fontSize: '26px', fontWeight: 800, margin: '6px 0 2px 0', letterSpacing: '-0.02em' }}>
            Welcome back, {user?.name || 'Accountant'}
          </h1>
          <p style={{ opacity: 0.85, fontSize: '13px', fontWeight: 500 }}>
            Workspace: <strong style={{ color: '#E5E7EB' }}>Apni Estate Enterprise</strong> • {formattedDate}
          </p>
        </div>
      </div>

      {/* KPI Stats Block */}
      <KPIWidget items={kpis} />

      {/* 2. Interactive Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-5)' }}>
        {/* Cash Flow Monthly Trend Area Chart */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} color="#10B981" />
            Monthly Cash Inflow vs Outflow Trend
          </h3>
          <AreaChartWidget data={data.cashFlowTrend} xKey="month" dataKeys={['credits', 'debits']} colors={['#10B981', '#EF4444']} />
        </div>

        {/* Expense Category Distribution Bar Chart */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calculator size={18} color="#F59E0B" />
            Expense Breakdown by Category
          </h3>
          {data.expensesByCategory.length === 0 ? (
            <EmptyStateWidget title="No Expenses" message="No expense records logged in the system yet." />
          ) : (
            <BarChartWidget data={data.expensesByCategory} xKey="category" dataKeys={['amount']} colors={['#EF4444']} />
          )}
        </div>
      </div>

      {/* Invoice & Purchase Order Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-5)' }}>
        {/* Invoice Status */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Receipt size={18} color="#3B82F6" />
            Vendor Invoice Status Distribution
          </h3>
          <DonutChartWidget data={invoiceData} colors={['#9CA3AF', '#F59E0B', '#10B981', '#EF4444']} />
        </div>

        {/* PO Status */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Truck size={18} color="#8B5CF6" />
            Purchase Order Pipeline Breakdown
          </h3>
          <DonutChartWidget data={poData} colors={['#9CA3AF', '#F59E0B', '#3B82F6', '#10B981']} />
        </div>
      </div>

      {/* Project Budgets and Outstanding Bills */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-5)' }}>
        {/* Project Budget utilization */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={18} color="#EC4899" />
            Project Budget Allocation & Utilization
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {data.budgetUtilization.length === 0 ? (
              <EmptyStateWidget title="No Budgets" message="No project budget limits allocated." />
            ) : (
              data.budgetUtilization.map((b: any, idx: number) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 4px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.projectName}</h4>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      Spent: ₹{b.spent?.toLocaleString()} / ₹{b.allocated?.toLocaleString()}
                    </span>
                  </div>
                  <ProgressRingWidget percentage={b.utilization} size={44} strokeWidth={4} color={b.utilization > 90 ? '#EF4444' : '#3B82F6'} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Outstanding payments */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} color="#EF4444" />
            Outstanding Payment Vouchers Ledger
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data.outstandingPayments.length === 0 ? (
              <EmptyStateWidget title="All Cleared" message="No outstanding vouchers pending release." />
            ) : (
              data.outstandingPayments.map((p: any) => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', border: '1px solid var(--color-border)', borderRadius: '12px' }}>
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>{p.vendor}</span>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Method: {p.method} • Date: {new Date(p.date).toLocaleDateString()}</div>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#EF4444' }}>₹{p.amount?.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Vendor payment stats & recent activities */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-5)' }}>
        {/* Vendor Payments */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileCheck size={18} color="#10B981" />
            Top Vendor Disbursements
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data.vendorPayments.length === 0 ? (
              <EmptyStateWidget title="No Disbursements" message="No payments processed for vendors yet." />
            ) : (
              data.vendorPayments.map((vp: any, idx: number) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', border: '1px solid var(--color-border)', borderRadius: '12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>{vp.name}</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>₹{vp.total?.toLocaleString()}</span>
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
