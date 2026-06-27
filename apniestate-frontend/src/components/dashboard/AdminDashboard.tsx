import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield,
  Users,
  Settings,
  Activity,
  CheckCircle,
  AlertTriangle,
  LogOut,
  FolderKanban,
  MapPin
} from 'lucide-react';
import { apiClient } from '@/api/client';
import EmptyState from '@/components/shared/EmptyState';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [usersRes, actRes] = await Promise.all([
          apiClient.get<any[]>('/users'),
          apiClient.get<any[]>('/activities/recent').catch(() => ({ data: [] } as any))
        ]);

        if (usersRes.success && usersRes.data) setUsers(usersRes.data);
        if (actRes.success && actRes.data) setActivities(Array.isArray(actRes.data) ? actRes.data : []);
      } catch (err) {
        console.error('Failed to load Admin dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="sd-skeleton sd-skeleton-hero" style={{ height: '80px', borderRadius: '16px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="sd-skeleton sd-skeleton-card" style={{ height: '140px', borderRadius: '16px' }} />
          ))}
        </div>
      </div>
    );
  }

  const formatRole = (role: string) =>
    role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
      <header style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '20px' }}>
        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Administrative Suite</span>
        <h1 style={{ fontSize: '28px', color: 'var(--color-text)', fontWeight: 800, letterSpacing: '-0.02em', marginTop: '4px' }}>Admin Controls & Auditing</h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: '4px', fontSize: '14px' }}>Configure organization members, modify security permission profiles, and view workspace audit events.</p>
      </header>

      {/* KPI Grid */}
      <div className="builder-grid-kpis">
        {[
          { title: 'Total Company Members', value: `${users.length} Members`, icon: Users, color: '#0A3D91', bg: 'rgba(10, 61, 145, 0.06)' },
          { title: 'Active System Nodes', value: '4 Active', icon: Activity, color: '#16A34A', bg: 'rgba(22, 163, 74, 0.06)' },
          { title: 'Security Status Profile', value: 'Secure', icon: Shield, color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.06)' }
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              whileHover={{ y: -4, boxShadow: '0 12px 20px rgba(0,0,0,0.04)' }}
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '16px',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 4px 6px rgba(0,0,0,0.01)'
              }}
            >
              <div>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 550 }}>{kpi.title}</span>
                <h3 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text)', margin: '6px 0 0 0', letterSpacing: '-0.02em' }}>
                  {kpi.value}
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

      {/* Main Sections */}
      <div className="builder-grid-sections">
        {/* Workspace Team Directory */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '16px' }}>Organization Member Directory</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {users.length === 0 ? (
              <EmptyState icon={<Users size={28} />} title="Directory Empty" description="No company members are currently registered in this workspace." />
            ) : (
              users.slice(0, 5).map((u) => (
                <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid var(--color-border)', borderRadius: '12px' }}>
                  <div>
                    <h5 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)' }}>{u.name}</h5>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{u.email}</span>
                  </div>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '4px 8px',
                    borderRadius: '6px',
                    background: 'rgba(10, 61, 145, 0.1)',
                    color: '#0A3D91'
                  }}>
                    {formatRole(u.role)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* System Activity logs */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '16px' }}>System Operational Logs</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {activities.length === 0 ? (
              <EmptyState icon={<Activity size={28} />} title="Logs Clean" description="No operational system logs recorded recently." />
            ) : (
              activities.slice(0, 5).map((log) => (
                <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', border: '1px solid var(--color-border)', borderRadius: '12px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(10, 61, 145, 0.05)',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Activity size={14} />
                  </div>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>{log.text}</p>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Timestamp: {log.time}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
