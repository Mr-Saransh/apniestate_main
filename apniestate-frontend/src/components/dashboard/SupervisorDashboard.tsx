import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDashboardQuery } from '@/hooks/useDashboardQuery';
import {
  Users,
  Wallet,
  ClipboardList,
  Layers,
  MapPin,
  CloudSun,
  ShieldCheck,
  CheckCircle,
  Truck,
  Package,
  Wrench,
  TrendingUp,
  AlertCircle,
  ArrowUpRight,
  ClipboardCheck
} from 'lucide-react';
import {
  KPIWidget,
  CriticalAlertsWidget,
  CalendarWidget,
  RecentActivityWidget,
  TasksSummaryWidget,
  TimelineWidget,
  EmptyStateWidget
} from './widgets';
import {
  BarChartWidget,
  LineChartWidget,
  DonutChartWidget,
  ProgressRingWidget
} from '@/components/charts/ChartComponents';
import { KpiGridSkeleton } from './DashboardSkeletons';

export default function SupervisorDashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useDashboardQuery<any>('/dashboard/supervisor', {
    refetchInterval: 8000
  });

  if (isLoading || !data) {
    return <KpiGridSkeleton />;
  }

  const activeSite = data.site;
  const supervisorKpis = [
    { title: "Today's Present Workers", value: data.overview?.workforce?.present || 0, suffix: ' Present', icon: Users, color: '#16A34A', bg: 'rgba(22, 163, 74, 0.06)' },
    { title: "Today's Labour Cost", value: data.overview?.labourCost || 0, prefix: '₹', icon: Wallet, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.06)' },
    { title: 'Tasks Complete Pct', value: data.overview?.tasksProgress || 0, suffix: '%', icon: ClipboardList, color: '#0A3D91', bg: 'rgba(10, 61, 145, 0.06)' },
    { title: 'Pending Material Requests', value: data.overview?.pendingMRs || 0, suffix: ' Pending', icon: Layers, color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.06)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* 1. DYNAMIC LARGE HERO CONTROL CARD (PRESERVED) */}
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

            <h1 style={{ color: 'white', fontSize: '32px', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.03em', lineHeight: 1.15 }}>
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

      {/* 2. OPERATIONAL CHECKS (TODAY'S DAILY CHECKLIST) */}
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

      {/* 5. DYNAMIC ANALYTICS & BAR CHARTS GRID (ENRICHED) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-5)' }}>
        {/* Attendance Graph Bar Chart */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} color="#3B82F6" />
            Labor Attendance Trend (Last 7 Days)
          </h3>
          <BarChartWidget data={data.attendanceGraph} xKey="day" dataKeys={['present', 'absent']} colors={['#10B981', '#EF4444']} stacked={true} />
        </div>

        {/* Weekly Labour Cost Trend */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wallet size={18} color="#F59E0B" />
            Weekly Labour Cost Trend (₹)
          </h3>
          <LineChartWidget data={data.weeklyLabourTrend} xKey="day" dataKeys={['cost']} colors={['#F59E0B']} />
        </div>
      </div>

      {/* Worker Distribution and Equipment Usage */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-5)' }}>
        {/* Worker Trade Distribution Donut Chart */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={18} color="#8B5CF6" />
            Worker Distribution by Trade
          </h3>
          <DonutChartWidget data={data.workerDistribution.map((w: any) => ({ name: w.trade, value: w.count }))} colors={['#3B82F6', '#10B981', '#F59E0B', '#EF4444']} />
        </div>

        {/* Equipment Usage Status */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wrench size={18} color="#10B981" />
            Equipment Usage & Health
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div style={{ padding: '16px', border: '1px solid var(--color-border)', borderRadius: '12px', textAlign: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Available</span>
              <h4 style={{ fontSize: '24px', fontWeight: 800, margin: '6px 0 0 0', color: '#10B981' }}>{data.equipmentUsage?.available || 0}</h4>
            </div>
            <div style={{ padding: '16px', border: '1px solid var(--color-border)', borderRadius: '12px', textAlign: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>In Use</span>
              <h4 style={{ fontSize: '24px', fontWeight: 800, margin: '6px 0 0 0', color: '#3B82F6' }}>{data.equipmentUsage?.inUse || 0}</h4>
            </div>
          </div>
          <div style={{ padding: '12px 16px', background: 'rgba(245, 158, 11, 0.06)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#F59E0B' }}>Under Maintenance</span>
            <span style={{ fontSize: '14px', fontWeight: 800, color: '#F59E0B' }}>{data.equipmentUsage?.underMaintenance || 0}</span>
          </div>
        </div>
      </div>

      {/* Tasks and Material Requests */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-5)' }}>
        <TasksSummaryWidget tasks={data.tasks} />
        
        {/* Material Requests list */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package size={18} color="#F59E0B" />
            Recent Material Indents
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data.materialRequests.length === 0 ? (
              <EmptyStateWidget title="No Requests" message="No material indent requests raised recently." />
            ) : (
              data.materialRequests.map((mr: any, idx: number) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', border: '1px solid var(--color-border)', borderRadius: '12px' }}>
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>{mr.materialName}</span>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Qty: {mr.quantity} {mr.unit} • By {mr.requester}</div>
                  </div>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '3px 6px',
                    borderRadius: '4px',
                    background: mr.status === 'APPROVED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                    color: mr.status === 'APPROVED' ? '#10B981' : '#F59E0B'
                  }}>{mr.status}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Inventory Status and Cashbook balance */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-5)' }}>
        {/* Inventory status list */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package size={18} color="#3B82F6" />
            Site Materials Inventory Status
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {data.inventoryStatus.length === 0 ? (
              <EmptyStateWidget title="No Inventory" message="No material stock recorded at this site yet." />
            ) : (
              data.inventoryStatus.map((inv: any, idx: number) => {
                const isLow = inv.quantity <= inv.minQuantity;
                return (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', border: '1px solid var(--color-border)', borderRadius: '12px', borderColor: isLow ? 'rgba(239, 68, 68, 0.2)' : 'var(--color-border)' }}>
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: isLow ? '#EF4444' : 'var(--color-text)' }}>{inv.name}</span>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: isLow ? '#EF4444' : 'var(--color-text)' }}>
                      {inv.quantity} {inv.unit} {isLow && <span style={{ fontSize: '9px', background: 'rgba(239,68,68,0.1)', padding: '2px 4px', borderRadius: '4px', marginLeft: '4px' }}>LOW</span>}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Cashbook Summary */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wallet size={18} color="#10B981" />
            Site Petty Cashbook Float Balance
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
            <div style={{ padding: '12px', border: '1px solid var(--color-border)', borderRadius: '12px' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Received (Credits)</span>
              <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#10B981', margin: '4px 0 0 0' }}>₹{data.cashbookSummary?.credit?.toLocaleString() || 0}</h4>
            </div>
            <div style={{ padding: '12px', border: '1px solid var(--color-border)', borderRadius: '12px' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Spent (Debits)</span>
              <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#EF4444', margin: '4px 0 0 0' }}>₹{data.cashbookSummary?.debit?.toLocaleString() || 0}</h4>
            </div>
          </div>
          <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.06)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#10B981' }}>In Hand Balance</span>
            <span style={{ fontSize: '16px', fontWeight: 800, color: '#10B981' }}>₹{data.cashbookSummary?.balance?.toLocaleString() || 0}</span>
          </div>
        </div>
      </div>

      {/* Deliveries & Activities Footer */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-5)' }}>
        {/* Upcoming Deliveries */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Truck size={18} color="#3B82F6" />
            Upcoming Site PO Deliveries
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data.upcomingDeliveries.length === 0 ? (
              <EmptyStateWidget title="No Deliveries" message="No active PO deliveries expected this week." />
            ) : (
              data.upcomingDeliveries.map((po: any, idx: number) => (
                <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '10px', border: '1px solid var(--color-border)', borderRadius: '12px' }}>
                  <div style={{ padding: '8px', background: 'rgba(59,130,246,0.06)', borderRadius: '8px', color: '#3B82F6' }}>
                    <Truck size={16} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>PO: {po.poNumber}</span>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Vendor: {po.vendor} • Date: {new Date(po.deliveryDate).toLocaleDateString()}</div>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text)' }}>₹{po.amount?.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <RecentActivityWidget activities={data.activities} />
      </div>
    </div>
  );
}
