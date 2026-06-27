import { useState, useTransition } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  FolderKanban, 
  Briefcase, 
  Users, 
  Wallet, 
  BarChart3, 
  Clock, 
  AlertTriangle, 
  ChevronRight, 
  Calendar,
  Layers,
  MapPin,
  FileText,
  UserCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { AnimatedNumber, ProgressRing } from '../shared';
import { SkeletonPulse, DashboardCardSkeleton, KpiGridSkeleton } from '../DashboardSkeletons';

// Helper: Risk badge colors
function getRiskBadgeColor(score: string) {
  switch (score) {
    case 'CRITICAL':
      return { bg: 'rgba(239, 68, 68, 0.1)', text: '#EF4444' };
    case 'HIGH':
      return { bg: 'rgba(245, 158, 11, 0.1)', text: '#F59E0B' };
    case 'MEDIUM':
      return { bg: 'rgba(59, 130, 246, 0.1)', text: '#3B82F6' };
    default:
      return { bg: 'rgba(16, 185, 129, 0.1)', text: '#10B981' };
  }
}

// 1. KPI WIDGET
interface KpiItem {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon: any;
  color: string;
  bg: string;
}
export function KPIWidget({ items, loading }: { items?: KpiItem[]; loading?: boolean }) {
  if (loading || !items) return <KpiGridSkeleton />;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)', width: '100%' }}>
      {items.map((kpi, idx) => {
        const Icon = kpi.icon;
        return (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
            whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(0,0,0,0.04)' }}
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '16px',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(0,0,0,0.01)',
              cursor: 'pointer'
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
  );
}

// 2. CRITICAL ALERTS WIDGET
interface AlertItem {
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'error';
  link: string;
}
export function CriticalAlertsWidget({ alerts, loading }: { alerts?: AlertItem[]; loading?: boolean }) {
  if (loading) return <DashboardCardSkeleton />;
  if (!alerts || alerts.length === 0) return null;

  return (
    <section style={{ background: 'rgba(239, 68, 68, 0.02)', border: '1px solid rgba(239, 68, 68, 0.12)', borderRadius: '20px', padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <AlertTriangle color="#EF4444" size={20} />
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)' }}>Critical Site Alerts</h2>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {alerts.map((alert, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--color-surface)',
              padding: '14px 18px',
              borderRadius: '14px',
              border: '1px solid var(--color-border)'
            }}
          >
            <div>
              <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text)' }}>{alert.title}</span>
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '2px' }}>{alert.description}</p>
            </div>
            <a
              href={alert.link}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}
            >
              Resolve <ChevronRight size={14} />
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}

// 3. PROJECT HEALTH INTELLIGENCE
interface ProjectHealthItem {
  id: string;
  name: string;
  progress: number;
  status: string;
  timelineStatus: string;
  budgetStatus: string;
  riskScore: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  healthScore: number;
}
export function ProjectHealthWidget({ projects, loading }: { projects?: ProjectHealthItem[]; loading?: boolean }) {
  if (loading) return <DashboardCardSkeleton />;
  if (!projects || projects.length === 0) return null;

  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '24px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '16px' }}>Project Health & Intelligence</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {projects.map((project) => (
          <div key={project.id} style={{ padding: '16px', border: '1px solid var(--color-border)', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)' }}>{project.name}</h4>
              <div style={{ display: 'flex', gap: '6px' }}>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '3px 6px',
                  borderRadius: '5px',
                  background: getRiskBadgeColor(project.riskScore).bg,
                  color: getRiskBadgeColor(project.riskScore).text
                }}>
                  RISK: {project.riskScore}
                </span>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '3px 6px',
                  borderRadius: '5px',
                  background: project.healthScore >= 75 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: project.healthScore >= 75 ? '#10B981' : '#EF4444'
                }}>
                  HEALTH: {project.healthScore}/100
                </span>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                <span>Timeline Progress</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{project.progress}%</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'var(--color-border)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${project.progress}%`, height: '100%', background: 'var(--color-primary)', borderRadius: '3px' }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 4. APPROVAL CENTER WIDGET
interface ApprovalItem {
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  status: string;
}
export function ApprovalWidget({ 
  mrs, pos, expenses, loading, onApprove 
}: { 
  mrs?: ApprovalItem[]; 
  pos?: ApprovalItem[]; 
  expenses?: ApprovalItem[]; 
  loading?: boolean; 
  onApprove?: (type: 'mr' | 'po' | 'expense', id: string) => void;
}) {
  const [tab, setTab] = useState<'mr' | 'po' | 'expense'>('mr');
  const [, startTransition] = useTransition();

  if (loading) return <DashboardCardSkeleton />;

  const currentList = tab === 'mr' ? mrs : tab === 'po' ? pos : expenses;
  const tabName = tab === 'mr' ? 'Material Requests' : tab === 'po' ? 'Purchase Orders' : 'Expenses';

  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '16px' }}>Approval Action Center</h3>
      <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid var(--color-border)', paddingBottom: '10px', marginBottom: '14px' }}>
        {[
          { id: 'mr', count: mrs?.length || 0, label: 'Materials' },
          { id: 'po', count: pos?.length || 0, label: 'POs' },
          { id: 'expense', count: expenses?.length || 0, label: 'Expenses' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => startTransition(() => setTab(t.id as any))}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: 'none',
              background: tab === t.id ? 'var(--color-primary)' : 'transparent',
              color: tab === t.id ? '#fff' : 'var(--color-text-muted)',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '320px', overflowY: 'auto' }}>
        {!currentList || currentList.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
            No pending approvals in {tabName}
          </div>
        ) : (
          currentList.map((item) => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid var(--color-border)', borderRadius: '12px' }}>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>{item.title}</span>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>{item.subtitle} • {item.meta}</div>
              </div>
              <button
                onClick={() => onApprove?.(tab, item.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'var(--color-success-bg, rgba(22, 163, 74, 0.08))',
                  color: 'var(--color-success, #16A34A)',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Approve
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// 5. WEATHER WIDGET
export function WeatherWidget({ temp, city, loading }: { temp?: string; city?: string; loading?: boolean }) {
  if (loading) return <SkeletonPulse style={{ width: 140, height: 46 }} />;

  return (
    <div style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ fontSize: '18px' }}>🌤️</span>
      <div>
        <div style={{ fontSize: '9px', opacity: 0.7, fontWeight: 700, letterSpacing: '0.05em' }}>WEATHER</div>
        <div style={{ fontSize: '12px', fontWeight: 700 }}>{temp || '28°C'} {city || 'Delhi NCR'}</div>
      </div>
    </div>
  );
}

// 6. CALENDAR & MILESTONES WIDGET
interface EventItem {
  id: string;
  title: string;
  start: string;
  type: string;
}
export function CalendarWidget({ events, loading }: { events?: EventItem[]; loading?: boolean }) {
  if (loading) return <DashboardCardSkeleton />;

  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '24px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '16px' }}>Project Calendar Milestones</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {!events || events.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
            No upcoming milestones
          </div>
        ) : (
          events.map((evt) => (
            <div key={evt.id} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '10px', border: '1px solid var(--color-border)', borderRadius: '12px' }}>
              <div style={{ background: 'var(--color-primary-50, rgba(10, 61, 145, 0.05))', color: 'var(--color-primary)', borderRadius: '8px', padding: '6px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Calendar size={16} />
              </div>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>{evt.title}</span>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>{new Date(evt.start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// 7. ATTENDANCE & WORKFORCE SUMMARY
export function AttendanceWidget({ present, absent, loading }: { present?: number; absent?: number; loading?: boolean }) {
  if (loading) return <DashboardCardSkeleton />;

  const total = (present || 0) + (absent || 0);
  const presentPct = total > 0 ? Math.round(((present || 0) / total) * 100) : 0;

  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)' }}>Workforce Presence</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <ProgressRing percentage={presentPct} size={90} strokeWidth={8} color="var(--color-primary)" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}><UserCheck size={14} color="#16A34A" /> Present</span>
            <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>{present || 0} Workers</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}><AlertCircle size={14} color="#DC2626" /> Absent</span>
            <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>{absent || 0} Workers</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// 8. RECENT ACTIVITIES WIDGET
interface ActivityItem {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  userName: string;
}
export function RecentActivityWidget({ activities, loading }: { activities?: ActivityItem[]; loading?: boolean }) {
  if (loading) return <DashboardCardSkeleton />;

  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '24px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '16px' }}>Recent Site Activities</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {!activities || activities.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
            No recent activities
          </div>
        ) : (
          activities.map((act) => (
            <div key={act.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-primary)', marginTop: '5px', flexShrink: 0 }} />
              <div>
                <span style={{ fontSize: '13px', color: 'var(--color-text)', fontWeight: 550 }}>{act.details}</span>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>By {act.userName} • {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// 9. TASKS LEDGER SUMMARY WIDGET
interface TaskItem {
  id: string;
  title: string;
  status: string;
  priority: string;
  assignee: string;
}
export function TasksSummaryWidget({ tasks, loading }: { tasks?: TaskItem[]; loading?: boolean }) {
  if (loading) return <DashboardCardSkeleton />;

  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '24px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '16px' }}>Site Tasks Summary</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {!tasks || tasks.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
            No tasks scheduled
          </div>
        ) : (
          tasks.map((task) => (
            <div key={task.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', border: '1px solid var(--color-border)', borderRadius: '12px' }}>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>{task.title}</span>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Assigned: {task.assignee}</div>
              </div>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '4px 8px',
                borderRadius: '6px',
                background: task.status === 'DONE' ? 'var(--color-success-bg, rgba(22, 163, 74, 0.06))' : 'var(--color-primary-50, rgba(10, 61, 145, 0.05))',
                color: task.status === 'DONE' ? '#16A34A' : '#0A3D91'
              }}>
                {task.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
