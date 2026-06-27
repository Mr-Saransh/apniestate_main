import { useEffect, useState, startTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderKanban,
  Briefcase,
  Clock,
  Users,
  Wallet,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Calendar,
  ChevronRight,
  TrendingUp,
  Package,
  Layers,
  ArrowUpRight,
  ClipboardList
} from 'lucide-react';
import { apiClient } from '@/api/client';
import { AnimatedNumber, ProgressRing } from './shared';
import { useAuth } from '@/context/AuthContext';
import EmptyState from '@/components/shared/EmptyState';
import { SkeletonPulse, KpiGridSkeleton, DashboardCardSkeleton, ShimmerStyle } from './DashboardSkeletons';

interface BuilderData {
  overview: {
    totalProjects: number;
    activeSites: number;
    completedProjects: number;
    delayedProjects: number;
    todayLabourCost: number;
    currentCashBalance: number;
    budgetUtilization: number;
  };
  alerts: Array<{
    type: string;
    title: string;
    description: string;
    link: string;
    severity: 'info' | 'warning' | 'error';
  }>;
  projectIntelligence: Array<{
    id: string;
    name: string;
    progress: number;
    status: string;
    timelineStatus: string;
    budgetStatus: string;
    riskScore: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    healthScore: number;
  }>;
  financialIntelligence: {
    creditSum: number;
    debitSum: number;
    recentExpenses: Array<{
      id: string;
      category: string;
      amount: number;
      description: string;
      date: string;
      status: string;
    }>;
  };
  workforceIntelligence: {
    present: number;
    absent: number;
  };
  calendarEvents: Array<{
    id: string;
    title: string;
    start: string;
    type: string;
  }>;
}

export default function BuilderDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<BuilderData | null>(null);
  const [approvalTab, setApprovalTab] = useState<'mr' | 'po' | 'expense'>('mr');
  const [pendingMRs, setPendingMRs] = useState<any[]>([]);
  const [pendingPOs, setPendingPOs] = useState<any[]>([]);
  const [pendingExpenses, setPendingExpenses] = useState<any[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchDashboardData = async () => {
    try {
      const res = await apiClient.get<BuilderData>('/dashboard/builder');
      if (res.success && res.data) {
        setData(res.data);
      }
      
      // Fetch details for Approval Center
      const [mrsRes, posRes, expRes] = await Promise.all([
        apiClient.get<any[]>('/material-requests'),
        apiClient.get<any[]>('/purchase-orders'),
        apiClient.get<any[]>('/finance'),
      ]);

      if (mrsRes.success && mrsRes.data) {
        setPendingMRs(mrsRes.data.filter((r: any) => r.status === 'PENDING'));
      }
      if (posRes.success && posRes.data) {
        setPendingPOs(posRes.data.filter((r: any) => r.status === 'PENDING' || r.status === 'DRAFT'));
      }
      if (expRes.success && expRes.data) {
        setPendingExpenses(expRes.data.filter((r: any) => r.status === 'PENDING'));
      }
    } catch (err) {
      console.error('Failed to load builder dashboard analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleApprove = async (id: string, type: 'mr' | 'po' | 'expense') => {
    try {
      if (type === 'mr') {
        await apiClient.patch(`/material-requests/${id}`, { status: 'APPROVED' });
        setPendingMRs((prev) => prev.filter((r) => r.id !== id));
      } else if (type === 'po') {
        await apiClient.patch(`/purchase-orders/${id}`, { status: 'APPROVED' });
        setPendingPOs((prev) => prev.filter((r) => r.id !== id));
      } else {
        await apiClient.patch(`/finance/${id}`, { status: 'APPROVED' });
        setPendingExpenses((prev) => prev.filter((r) => r.id !== id));
      }
      setToast({ message: 'Request approved successfully!', type: 'success' });
      fetchDashboardData();
    } catch (err) {
      setToast({ message: 'Failed to approve request.', type: 'error' });
    }
  };

  const handleReject = async (id: string, type: 'mr' | 'po' | 'expense') => {
    try {
      if (type === 'mr') {
        await apiClient.patch(`/material-requests/${id}`, { status: 'REJECTED' });
        setPendingMRs((prev) => prev.filter((r) => r.id !== id));
      } else if (type === 'po') {
        await apiClient.patch(`/purchase-orders/${id}`, { status: 'REJECTED' });
        setPendingPOs((prev) => prev.filter((r) => r.id !== id));
      } else {
        await apiClient.patch(`/finance/${id}`, { status: 'REJECTED' });
        setPendingExpenses((prev) => prev.filter((r) => r.id !== id));
      }
      setToast({ message: 'Request rejected.', type: 'info' } as any);
      fetchDashboardData();
    } catch (err) {
      setToast({ message: 'Failed to reject request.', type: 'error' });
    }
  };

  if (loading || !data) {
    return (
      <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
        <ShimmerStyle />
        <SkeletonPulse style={{ height: '130px', borderRadius: '20px' }} />
        <KpiGridSkeleton />
        <div className="builder-grid-sections">
          <DashboardCardSkeleton title="Project Portfolio Intelligence" />
          <DashboardCardSkeleton title="Executive Approval Center" />
        </div>
      </div>
    );
  }

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'CRITICAL': return { bg: 'rgba(239, 68, 68, 0.1)', text: '#EF4444' };
      case 'HIGH': return { bg: 'rgba(245, 158, 11, 0.1)', text: '#F59E0B' };
      case 'MEDIUM': return { bg: 'rgba(59, 130, 246, 0.1)', text: '#3B82F6' };
      default: return { bg: 'rgba(16, 185, 129, 0.1)', text: '#10B981' };
    }
  };

  const formattedDate = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="builder-dashboard-container" style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
      {/* Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'fixed',
              top: '80px',
              right: '24px',
              zIndex: 1000,
              background: toast.type === 'success' ? '#10B981' : '#EF4444',
              color: '#fff',
              padding: '12px 24px',
              borderRadius: '12px',
              boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
              fontWeight: 600
            }}
            onClick={() => setToast(null)}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div 
        style={{ 
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
        }}
      >
        <div style={{ position: 'absolute', right: '-40px', bottom: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />
        
        <div>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#F4B400', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Executive Dashboard
          </span>
          <h1 style={{ fontSize: '26px', fontWeight: 800, margin: '6px 0 2px 0', letterSpacing: '-0.02em' }}>
            Welcome back, {user?.name || 'Lead Builder'}
          </h1>
          <p style={{ opacity: 0.85, fontSize: '13px', fontWeight: 500 }}>
            Active Workspace: <strong style={{ color: '#F4B400' }}>Apni Estate Enterprise</strong> • {formattedDate}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>🌤️</span>
            <div>
              <div style={{ fontSize: '9px', opacity: 0.7, fontWeight: 700, letterSpacing: '0.05em' }}>WEATHER</div>
              <div style={{ fontSize: '12px', fontWeight: 700 }}>28°C Delhi NCR</div>
            </div>
          </div>
          
          <div style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>📊</span>
            <div>
              <div style={{ fontSize: '9px', opacity: 0.7, fontWeight: 700, letterSpacing: '0.05em' }}>PORTFOLIO</div>
              <div style={{ fontSize: '12px', fontWeight: 700 }}>Stable & Active</div>
            </div>
          </div>
        </div>
      </div>

      {/* 1. Overview KPIs grid */}
      <div className="builder-grid-kpis">
        {[
          { title: 'Total Portfolio Projects', value: data.overview.totalProjects, suffix: ' Projects', icon: FolderKanban, color: '#0A3D91', bg: 'rgba(10, 61, 145, 0.06)' },
          { title: 'Active Construction Sites', value: data.overview.activeSites, suffix: ' Sites', icon: Briefcase, color: '#16A34A', bg: 'rgba(22, 163, 74, 0.06)' },
          { title: 'Today\'s Labor Cost', value: data.overview.todayLabourCost, prefix: '₹', icon: Users, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.06)' },
          { title: 'Current Cash Balance', value: data.overview.currentCashBalance, prefix: '₹', icon: Wallet, color: '#10B981', bg: 'rgba(16, 185, 129, 0.06)' },
          { title: 'Budget Burn Rate', value: data.overview.budgetUtilization, suffix: '%', icon: BarChart3, color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.06)' },
          { title: 'Delayed Projects', value: data.overview.delayedProjects, suffix: ' Delayed', icon: Clock, color: '#DC2626', bg: 'rgba(220, 38, 38, 0.06)' },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              whileHover={{ y: -4, boxShadow: '0 12px 20px rgba(0,0,0,0.05)' }}
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '16px',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 4px 6px rgba(0,0,0,0.01)',
                cursor: 'pointer',
                transition: 'border-color 0.2s ease'
              }}
            >
              <div>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 550 }}>{kpi.title}</span>
                <h3 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text)', margin: '6px 0 0 0', letterSpacing: '-0.02em' }}>
                  <AnimatedNumber value={kpi.value} prefix={kpi.prefix} suffix={kpi.suffix} />
                </h3>
              </div>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: kpi.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: kpi.color
              }}>
                <Icon size={22} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 2. Critical Alerts */}
      {data.alerts.length > 0 && (
        <section style={{ background: 'rgba(239, 68, 68, 0.03)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '16px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <AlertTriangle color="#EF4444" size={20} />
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)' }}>Critical Business Alerts</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {data.alerts.map((alert, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'var(--color-surface)',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid var(--color-border)'
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text)' }}>{alert.title}</span>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '2px' }}>{alert.description}</p>
                </div>
                <button
                  onClick={() => startTransition(() => { window.location.href = alert.link; })}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--color-primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Resolve <ChevronRight size={14} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. Middle Section: Project Intelligence & Unified Approval Center */}
      <motion.div 
        className="builder-grid-sections"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        
        {/* Project Intelligence */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '16px' }}>Project Portfolio Intelligence</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {data.projectIntelligence.map((project) => (
              <div key={project.id} style={{ padding: '16px', border: '1px solid var(--color-border)', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)' }}>{project.name}</h4>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '4px 8px',
                      borderRadius: '6px',
                      background: getRiskBadgeColor(project.riskScore).bg,
                      color: getRiskBadgeColor(project.riskScore).text
                    }}>
                      RISK: {project.riskScore}
                    </span>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '4px 8px',
                      borderRadius: '6px',
                      background: project.healthScore >= 75 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: project.healthScore >= 75 ? '#10B981' : '#EF4444'
                    }}>
                      HEALTH: {project.healthScore}/100
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                    <span>Timeline Completion</span>
                    <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{project.progress}%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'var(--color-border)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${project.progress}%`, height: '100%', background: 'var(--color-primary)', borderRadius: '4px' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  <span>Status: <strong style={{ color: 'var(--color-text)' }}>{project.status}</strong></span>
                  <span>Finance: <strong style={{ color: project.budgetStatus === 'OVER_BUDGET' ? '#EF4444' : '#10B981' }}>{project.budgetStatus.replace('_', ' ')}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Unified Approval Center */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '16px' }}>Executive Approval Center</h3>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px', marginBottom: '16px' }}>
            {[
              { id: 'mr', label: `Material Requests (${pendingMRs.length})` },
              { id: 'po', label: `Purchase Orders (${pendingPOs.length})` },
              { id: 'expense', label: `Expenses (${pendingExpenses.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setApprovalTab(tab.id as any)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: approvalTab === tab.id ? 'var(--color-primary)' : 'transparent',
                  color: approvalTab === tab.id ? '#fff' : 'var(--color-text-muted)',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '380px' }}>
            {approvalTab === 'mr' && (
              pendingMRs.length === 0 ? (
                <EmptyState icon={<ClipboardList size={28} />} title="All Clear" description="No pending material requests require your review." />
              ) : (
                pendingMRs.map((mr) => (
                  <div key={mr.id} style={{ padding: '14px', border: '1px solid var(--color-border)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h5 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)' }}>{mr.material?.name || 'Material'}</h5>
                      <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Quantity: {mr.quantity} {mr.material?.unit} • Site: {mr.site?.name}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleApprove(mr.id, 'mr')} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: '#10B981', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Approve</button>
                      <button onClick={() => handleReject(mr.id, 'mr')} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-muted)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Reject</button>
                    </div>
                  </div>
                ))
              )
            )}

            {approvalTab === 'po' && (
              pendingPOs.length === 0 ? (
                <EmptyState icon={<Briefcase size={28} />} title="No Pending POs" description="All purchase orders have been signed or rejected." />
              ) : (
                pendingPOs.map((po) => (
                  <div key={po.id} style={{ padding: '14px', border: '1px solid var(--color-border)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h5 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)' }}>PO #{po.po_number || po.id.slice(0, 6)}</h5>
                      <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Vendor: {po.vendor?.name} • Amount: <strong>₹{po.total_amount.toLocaleString('en-IN')}</strong></span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleApprove(po.id, 'po')} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: '#10B981', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Approve</button>
                      <button onClick={() => handleReject(po.id, 'po')} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-muted)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Reject</button>
                    </div>
                  </div>
                ))
              )
            )}

            {approvalTab === 'expense' && (
              pendingExpenses.length === 0 ? (
                <EmptyState icon={<Wallet size={28} />} title="Expenses Reconciled" description="All worker and site expenses are approved and closed." />
              ) : (
                pendingExpenses.map((exp) => (
                  <div key={exp.id} style={{ padding: '14px', border: '1px solid var(--color-border)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h5 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)' }}>{exp.category}</h5>
                      <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{exp.description} • Amount: <strong>₹{exp.amount.toLocaleString('en-IN')}</strong></span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleApprove(exp.id, 'expense')} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: '#10B981', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Approve</button>
                      <button onClick={() => handleReject(exp.id, 'expense')} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-muted)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Reject</button>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </div>

      </motion.div>

      {/* 4. Lower Section: Construction Timeline Calendar & Recent Expenditures */}
      <motion.div 
        className="builder-grid-sections"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        
        {/* Unified Construction Calendar */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Calendar color="var(--color-primary)" size={20} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text)' }}>Unified Construction Calendar</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '350px' }}>
            {data.calendarEvents.length === 0 ? (
              <EmptyState icon={<Calendar size={28} />} title="Calendar Empty" description="No upcoming construction events or milestones are scheduled." />
            ) : (
              data.calendarEvents.map((evt) => (
                <div key={evt.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', border: '1px solid var(--color-border)', borderRadius: '12px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '8px',
                    background: evt.type === 'MILESTONE' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                    color: evt.type === 'MILESTONE' ? '#8B5CF6' : '#10B981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '11px'
                  }}>
                    {evt.type.slice(0, 2)}
                  </div>
                  <div>
                    <h5 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>{evt.title}</h5>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Date: {new Date(evt.start).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Financial Expense Audit Log */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <TrendingUp color="#10B981" size={20} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text)' }}>Recent Financial Expenses</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '350px' }}>
            {data.financialIntelligence.recentExpenses.length === 0 ? (
              <EmptyState icon={<TrendingUp size={28} />} title="No Expenses Found" description="All expenses are audited and clean." />
            ) : (
              data.financialIntelligence.recentExpenses.map((exp) => (
                <div key={exp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid var(--color-border)', borderRadius: '12px' }}>
                  <div>
                    <h5 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>{exp.category}</h5>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{exp.description || 'No description'} • {new Date(exp.date).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: '#EF4444' }}>-₹{exp.amount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </motion.div>
    </div>
  );
}
