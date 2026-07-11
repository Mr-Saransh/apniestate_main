import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '@/context/ProjectContext';
import { apiClient } from '@/api/client';
import {
  Users, IndianRupee, Package, CreditCard, Truck, Wrench,
  AlertTriangle, AlertCircle, Info, ChevronRight,
  Plus, ClipboardList, UserCheck, FileText, ShoppingCart, Landmark,
  Target, Calendar, ArrowRight, Activity, Clock, Edit, BarChart2,
  Building2, MapPin, TrendingUp
} from 'lucide-react';

// Types for the project summary API response
interface ProjectSummary {
  project: {
    id: string; name: string; status: string; budget: number | null;
    actual_cost: number | null; start_date: string; end_date: string | null;
    progress_percentage: number; manager: string; sitesCount: number; activeSitesCount: number;
  };
  todaySummary: {
    labourCount: number; labourCost: number; todayExpense: number;
    pendingMaterialRequests: number; pendingVendorPayments: number;
    materialsReceivedToday: number; equipmentRunning: number;
  };
  alerts: { type: string; message: string; link: string; severity: string }[];
  progress: {
    currentMilestone: { name: string; targetDate: string; status: string } | null;
    completionPercent: number;
    nextMilestone: { name: string; targetDate: string } | null;
    recentDpr: { date: string; summary: string; site: string } | null;
    totalMilestones: number; completedMilestones: number;
  };
  recentActivity: { id: string; type: string; action: string; description: string; time: string; metadata: any }[];
}

// === Helper Components ===

function StatCard({ icon: Icon, label, value, suffix, link, color }: {
  icon: any; label: string; value: number | string; suffix?: string; link: string; color: string;
}) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(link)}
      className="stat-card"
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px',
        padding: '16px', borderRadius: '14px', border: '1px solid var(--color-border)',
        background: 'var(--color-surface)', cursor: 'pointer', width: '100%', textAlign: 'left',
        transition: 'all 0.2s ease', position: 'relative', overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px',
        borderRadius: '50%', background: color, opacity: 0.06
      }} />
      <div style={{
        width: '36px', height: '36px', borderRadius: '10px', display: 'flex',
        alignItems: 'center', justifyContent: 'center', background: color + '15', color: color,
      }}>
        <Icon size={18} />
      </div>
      <div>
        <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-foreground)', lineHeight: 1.1 }}>
          {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
          {suffix && <span style={{ fontSize: '13px', fontWeight: 500, opacity: 0.6, marginLeft: '2px' }}>{suffix}</span>}
        </div>
        <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-text-muted)', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {label}
        </div>
      </div>
    </button>
  );
}

function AlertItem({ alert, onClick }: { alert: any; onClick: () => void }) {
  const iconMap: Record<string, any> = {
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };
  const colorMap: Record<string, string> = {
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
  };
  const Icon = iconMap[alert.severity] || Info;
  const color = colorMap[alert.severity] || '#3B82F6';

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
        padding: '12px 14px', borderRadius: '12px', border: `1px solid ${color}20`,
        background: `${color}08`, cursor: 'pointer', textAlign: 'left',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{
        width: '32px', height: '32px', borderRadius: '8px', display: 'flex',
        alignItems: 'center', justifyContent: 'center', background: `${color}15`,
        color: color, flexShrink: 0
      }}>
        <Icon size={16} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-foreground)', lineHeight: 1.3 }}>
          {alert.message}
        </div>
      </div>
      <ChevronRight size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
    </button>
  );
}

function QuickActionButton({ icon: Icon, label, link, color }: {
  icon: any; label: string; link: string; color: string;
}) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(link)}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: '8px', padding: '16px 8px', borderRadius: '14px', border: '1px solid var(--color-border)',
        background: 'var(--color-surface)', cursor: 'pointer', width: '100%',
        transition: 'all 0.2s ease', minHeight: '90px',
      }}
    >
      <div style={{
        width: '40px', height: '40px', borderRadius: '12px', display: 'flex',
        alignItems: 'center', justifyContent: 'center', background: color, color: '#fff',
      }}>
        <Icon size={20} />
      </div>
      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-foreground)', textAlign: 'center', lineHeight: 1.2 }}>
        {label}
      </span>
    </button>
  );
}

function SectionHeader({ title, icon: Icon }: { title: string; icon?: any }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', paddingTop: '4px',
    }}>
      {Icon && <Icon size={16} style={{ color: 'var(--color-primary)' }} />}
      <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-foreground)', margin: 0 }}>{title}</h2>
    </div>
  );
}

// === Main Component ===

export default function ProjectCommandCenter() {
  const { activeProject, activeProjectId } = useProject();
  const navigate = useNavigate();
  const [data, setData] = useState<ProjectSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeProjectId) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    apiClient.get<ProjectSummary>(`/project-summary?project_id=${activeProjectId}`)
      .then(res => {
        if (res.data) setData(res.data);
      })
      .catch(err => console.error('Failed to load project summary', err))
      .finally(() => setLoading(false));
  }, [activeProjectId]);

  if (!activeProjectId || !activeProject) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '60vh', gap: '16px', padding: '24px', textAlign: 'center',
      }}>
        <Building2 size={48} style={{ color: 'var(--color-text-muted)', opacity: 0.4 }} />
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-foreground)' }}>Select a Project</h2>
        <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', maxWidth: '320px' }}>
          Choose a project from the switcher above to view your command center.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh',
      }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%',
          border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const project = data?.project;
  const summary = data?.todaySummary;
  const alerts = data?.alerts || [];
  const progress = data?.progress;
  const activity = data?.recentActivity || [];

  const statusColor: Record<string, string> = {
    PLANNING: '#6B7280', ACTIVE: '#10B981', ON_HOLD: '#F59E0B', COMPLETED: '#3B82F6', CANCELLED: '#EF4444'
  };

  const formatCurrency = (n: number | null | undefined) => {
    if (!n) return '₹0';
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
    return `₹${n.toLocaleString('en-IN')}`;
  };

  const formatDate = (d: string | null | undefined) => {
    if (!d) return '--';
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const timeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div style={{
      maxWidth: '800px', margin: '0 auto', padding: '0 4px',
      display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '100px',
    }}>

      {/* === PROJECT HEADER === */}
      <div style={{
        background: 'linear-gradient(135deg, var(--color-primary), #1e40af)',
        borderRadius: '16px', padding: '20px', color: '#fff', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', bottom: '-30px', left: '-30px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', position: 'relative' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0, lineHeight: 1.2 }}>{project?.name}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
              <span style={{
                fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px',
                background: (statusColor[project?.status || ''] || '#6B7280') + '30',
                color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px',
              }}>
                {project?.status}
              </span>
              <span style={{ fontSize: '12px', opacity: 0.8 }}>
                <MapPin size={11} style={{ marginRight: '3px', verticalAlign: '-1px' }} />
                {project?.sitesCount} site{(project?.sitesCount || 0) > 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={() => navigate(`/projects/${project?.id}`)} style={{
              padding: '6px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.15)',
              color: '#fff', fontSize: '11px', fontWeight: 600, cursor: 'pointer', border: 'none',
              display: 'flex', alignItems: 'center', gap: '4px',
            }}>
              <Edit size={12} /> Edit
            </button>
            <button onClick={() => navigate('/reports')} style={{
              padding: '6px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.15)',
              color: '#fff', fontSize: '11px', fontWeight: 600, cursor: 'pointer', border: 'none',
              display: 'flex', alignItems: 'center', gap: '4px',
            }}>
              <BarChart2 size={12} /> Reports
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px',
          background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px',
          position: 'relative',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '16px', fontWeight: 800 }}>{formatCurrency(project?.budget)}</div>
            <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '2px' }}>Budget</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '16px', fontWeight: 800 }}>{formatDate(project?.start_date)}</div>
            <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '2px' }}>Start</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '16px', fontWeight: 800 }}>{project?.progress_percentage || 0}%</div>
            <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '2px' }}>Complete</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '16px', fontWeight: 800 }}>{project?.manager}</div>
            <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '2px' }}>Supervisor</div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: '12px', background: 'rgba(255,255,255,0.15)', borderRadius: '6px', height: '6px', overflow: 'hidden' }}>
          <div style={{
            width: `${project?.progress_percentage || 0}%`, height: '100%',
            background: '#34D399', borderRadius: '6px', transition: 'width 0.8s ease',
          }} />
        </div>
      </div>

      {/* === TODAY'S SUMMARY === */}
      <div>
        <SectionHeader title="Today's Summary" icon={Calendar} />
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px',
        }}>
          <StatCard icon={Users} label="Labour" value={summary?.labourCount || 0} link="/operations?tab=labour" color="#3B82F6" />
          <StatCard icon={IndianRupee} label="Expense" value={formatCurrency(summary?.todayExpense || 0)} link="/finance?tab=expenses" color="#EF4444" />
          <StatCard icon={Package} label="Material Req" value={summary?.pendingMaterialRequests || 0} suffix="pending" link="/purchase?tab=requests" color="#F59E0B" />
          <StatCard icon={CreditCard} label="Payments Due" value={summary?.pendingVendorPayments || 0} suffix="pending" link="/finance?tab=payments" color="#8B5CF6" />
          <StatCard icon={Truck} label="Received" value={summary?.materialsReceivedToday || 0} suffix="today" link="/purchase?tab=inventory" color="#10B981" />
          <StatCard icon={Wrench} label="Equipment" value={summary?.equipmentRunning || 0} suffix="running" link="/operations?tab=equipment" color="#06B6D4" />
        </div>
      </div>

      {/* === NEEDS ATTENTION === */}
      {alerts.length > 0 && (
        <div>
          <SectionHeader title="Needs Attention" icon={AlertTriangle} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {alerts.map((alert, i) => (
              <AlertItem key={i} alert={alert} onClick={() => navigate(alert.link)} />
            ))}
          </div>
        </div>
      )}

      {/* === PROJECT PROGRESS === */}
      <div>
        <SectionHeader title="Project Progress" icon={Target} />
        <div style={{
          borderRadius: '14px', border: '1px solid var(--color-border)',
          background: 'var(--color-surface)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px',
        }}>
          {/* Progress bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-foreground)' }}>
                Overall Completion
              </span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)' }}>
                {progress?.completionPercent || 0}%
              </span>
            </div>
            <div style={{ background: 'var(--color-border)', borderRadius: '6px', height: '8px', overflow: 'hidden' }}>
              <div style={{
                width: `${progress?.completionPercent || 0}%`, height: '100%',
                background: 'var(--color-primary)', borderRadius: '6px', transition: 'width 0.8s ease',
              }} />
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              {progress?.completedMilestones || 0} of {progress?.totalMilestones || 0} milestones completed
            </div>
          </div>

          {/* Milestones */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {progress?.currentMilestone && (
              <div style={{
                padding: '12px', borderRadius: '10px', background: 'var(--color-primary-bg, rgba(59,130,246,0.06))',
                border: '1px solid rgba(59,130,246,0.12)',
              }}>
                <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Current Milestone
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-foreground)', marginTop: '4px' }}>
                  {progress.currentMilestone.name}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  Due: {formatDate(progress.currentMilestone.targetDate)}
                </div>
              </div>
            )}
            {progress?.nextMilestone && (
              <div style={{
                padding: '12px', borderRadius: '10px', background: 'rgba(107,114,128,0.06)',
                border: '1px solid rgba(107,114,128,0.12)',
              }}>
                <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Next Milestone
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-foreground)', marginTop: '4px' }}>
                  {progress.nextMilestone.name}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  Due: {formatDate(progress.nextMilestone.targetDate)}
                </div>
              </div>
            )}
          </div>

          {/* Recent DPR */}
          {progress?.recentDpr && (
            <div style={{
              padding: '12px', borderRadius: '10px', borderTop: '1px solid var(--color-border)',
            }}>
              <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                Latest DPR — {progress.recentDpr.site}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-foreground)', lineHeight: 1.4 }}>
                {progress.recentDpr.summary?.slice(0, 120)}{progress.recentDpr.summary?.length > 120 ? '...' : ''}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                {formatDate(progress.recentDpr.date)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* === RECENT ACTIVITY === */}
      {activity.length > 0 && (
        <div>
          <SectionHeader title="Recent Activity" icon={Activity} />
          <div style={{
            borderRadius: '14px', border: '1px solid var(--color-border)',
            background: 'var(--color-surface)', overflow: 'hidden',
          }}>
            {activity.map((item, i) => (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 14px',
                borderBottom: i < activity.length - 1 ? '1px solid var(--color-border)' : 'none',
              }}>
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                  background: item.action === 'CREATE' ? '#10B981' : item.action === 'UPDATE' ? '#3B82F6' : '#6B7280',
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', color: 'var(--color-foreground)', fontWeight: 500 }}>
                    {item.description}
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Clock size={10} /> {timeAgo(item.time)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* === QUICK ACTIONS === */}
      <div>
        <SectionHeader title="Quick Actions" icon={ArrowRight} />
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px',
        }}>
          <QuickActionButton icon={Package} label="Material Request" link="/material-requests" color="#F59E0B" />
          <QuickActionButton icon={IndianRupee} label="Add Expense" link="/expenses" color="#EF4444" />
          <QuickActionButton icon={UserCheck} label="Mark Attendance" link="/attendance" color="#10B981" />
          <QuickActionButton icon={FileText} label="Create DPR" link="/dpr" color="#3B82F6" />
          <QuickActionButton icon={ShoppingCart} label="Purchase Orders" link="/purchase-orders" color="#8B5CF6" />
          <QuickActionButton icon={Landmark} label="View Finance" link="/finance" color="#06B6D4" />
        </div>
      </div>

    </div>
  );
}
