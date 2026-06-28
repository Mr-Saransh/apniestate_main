import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDashboardQuery } from '@/hooks/useDashboardQuery';
import {
  Shield,
  Users,
  Activity,
  FolderKanban,
  MapPin,
  Settings,
  AlertTriangle,
  HardHat,
  Database,
  Lock,
  ArrowUpRight
} from 'lucide-react';
import {
  KPIWidget,
  RecentActivityWidget,
  EmptyStateWidget
} from './widgets';
import {
  BarChartWidget,
  DonutChartWidget
} from '@/components/charts/ChartComponents';
import { KpiGridSkeleton } from './DashboardSkeletons';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useDashboardQuery<any>('/dashboard/admin', {
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
    { title: 'Total Members', value: data.overview.totalUsers || 0, icon: Users, color: '#3B82F6', bg: 'rgba(59, 132, 246, 0.06)' },
    { title: 'Active Members', value: data.overview.activeUsers || 0, icon: Activity, color: '#10B981', bg: 'rgba(16, 185, 129, 0.06)' },
    { title: 'Projects Created', value: data.overview.totalProjects || 0, icon: FolderKanban, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.06)' },
    { title: 'Sites Supervised', value: data.overview.totalSites || 0, icon: MapPin, color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.06)' },
    { title: 'Active Workers', value: data.overview.totalWorkers || 0, icon: HardHat, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.06)' },
    { title: 'System Security Health', value: 100, suffix: '%', icon: Shield, color: '#EC4899', bg: 'rgba(236, 72, 153, 0.06)' },
  ];

  const roleChartData = data.usersByRole.map((u: any) => ({
    role: u.role.replace(/_/g, ' '),
    count: u.count
  }));

  const projectStatusData = data.projectsByStatus.map((p: any) => ({
    name: p.status,
    value: p.count
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* 1. DYNAMIC LARGE HERO CONTROL CARD (PRESERVED) */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #311042 100%)',
        borderRadius: '20px',
        padding: '28px',
        color: '#FFFFFF',
        boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
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
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Enterprise System Administrator
          </span>
          <h1 style={{ fontSize: '26px', fontWeight: 800, margin: '6px 0 2px 0', letterSpacing: '-0.02em' }}>
            Welcome back, {user?.name || 'Administrator'}
          </h1>
          <p style={{ opacity: 0.85, fontSize: '13px', fontWeight: 500 }}>
            Workspace: <strong style={{ color: '#c084fc' }}>Apni Estate Command Center</strong> • {formattedDate}
          </p>
        </div>
      </div>

      {/* KPI Stats Block */}
      <KPIWidget items={kpis} />

      {/* 2. Interactive Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 'var(--space-5)' }}>
        {/* Users by Role Bar Chart */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} color="#3B82F6" />
            Workspace Organization Roles Breakdown
          </h3>
          <BarChartWidget data={roleChartData} xKey="role" dataKeys={['count']} colors={['#3B82F6']} />
        </div>

        {/* Projects status distribution Donut Chart */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderKanban size={18} color="#F59E0B" />
            Project Lifecycle Status Distribution
          </h3>
          <DonutChartWidget data={projectStatusData} colors={['#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#8B5CF6']} />
        </div>
      </div>

      {/* Entity Database Statistics & Security Audit */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-5)' }}>
        {/* Storage / Entity usage metrics */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={18} color="#8B5CF6" />
            Workspace Entity Storage Count Ledger
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ padding: '12px 14px', border: '1px solid var(--color-border)', borderRadius: '12px' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Tasks Created</span>
              <h4 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text)', margin: '4px 0 0 0' }}>{data.storageStats.tasks}</h4>
            </div>
            <div style={{ padding: '12px 14px', border: '1px solid var(--color-border)', borderRadius: '12px' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Materials Tracked</span>
              <h4 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text)', margin: '4px 0 0 0' }}>{data.storageStats.materials}</h4>
            </div>
            <div style={{ padding: '12px 14px', border: '1px solid var(--color-border)', borderRadius: '12px' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Uploaded Documents</span>
              <h4 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text)', margin: '4px 0 0 0' }}>{data.storageStats.documents}</h4>
            </div>
            <div style={{ padding: '12px 14px', border: '1px solid var(--color-border)', borderRadius: '12px' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Registered Vendors</span>
              <h4 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text)', margin: '4px 0 0 0' }}>{data.storageStats.vendors}</h4>
            </div>
          </div>
        </div>

        {/* Security / System Health Widget */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={18} color="#EC4899" />
            System API Health & Audit
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', border: '1px solid var(--color-border)', borderRadius: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>REST API Server Status</span>
              <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 6px', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', borderRadius: '4px' }}>ONLINE (99.9%)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', border: '1px solid var(--color-border)', borderRadius: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>Database Engine Status</span>
              <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 6px', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', borderRadius: '4px' }}>CONNECTED</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', border: '1px solid var(--color-border)', borderRadius: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>Security / SSL Verification</span>
              <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 6px', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', borderRadius: '4px' }}>SECURED</span>
            </div>
          </div>
        </div>
      </div>

      {/* Audit log list */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-5)' }}>
        <RecentActivityWidget activities={data.recentActivities} />
      </div>
    </div>
  );
}
