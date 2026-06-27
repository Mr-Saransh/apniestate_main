import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Briefcase,
  ClipboardList,
  Calendar,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Layers,
  Clock,
  CheckCircle,
  FileText
} from 'lucide-react';
import { apiClient } from '@/api/client';
import EmptyState from '@/components/shared/EmptyState';

export default function ProjectManagerDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [dprs, setDprs] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [projRes, tasksRes, dprsRes] = await Promise.all([
          apiClient.get<any[]>('/projects'),
          apiClient.get<any[]>('/tasks'),
          apiClient.get<any[]>('/dpr/pending').catch(() => ({ data: [] } as any))
        ]);

        if (projRes.success && projRes.data) setProjects(projRes.data);
        if (tasksRes.success && tasksRes.data) setTasks(tasksRes.data);
        if (dprsRes.success && dprsRes.data) setDprs(Array.isArray(dprsRes.data) ? dprsRes.data : []);
      } catch (err) {
        console.error('Failed to load project manager dashboard data:', err);
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

  // Calculate statistics
  const activeProjects = projects.filter(p => p.status === 'ACTIVE' || p.status === 'PLANNING').length;
  const pendingTasks = tasks.filter(t => t.status === 'TODO' || t.status === 'IN_PROGRESS').length;
  const completedTasks = tasks.filter(t => t.status === 'DONE').length;
  const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  return (
    <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
      <header style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '20px' }}>
        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Execution Command Center</span>
        <h1 style={{ fontSize: '28px', color: 'var(--color-text)', fontWeight: 800, letterSpacing: '-0.02em', marginTop: '4px' }}>Project Manager Console</h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: '4px', fontSize: '14px' }}>Track timeline milestones, resource assignments, and site progress.</p>
      </header>

      {/* KPI Grid */}
      <div className="builder-grid-kpis">
        {[
          { title: 'Active Projects under Supervision', value: activeProjects, suffix: ' Projects', icon: Briefcase, color: '#0A3D91', bg: 'rgba(10, 61, 145, 0.06)' },
          { title: 'Active Milestone Tasks', value: pendingTasks, suffix: ' Pending', icon: ClipboardList, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.06)' },
          { title: 'Task Completion Rate', value: completionRate, suffix: '% Done', icon: CheckCircle, color: '#16A34A', bg: 'rgba(22, 163, 74, 0.06)' }
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
                  {kpi.value}{kpi.suffix}
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

      {/* Main Section */}
      <div className="builder-grid-sections">
        {/* Project Progress */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '16px' }}>Project Timelines & Milestones</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {projects.length === 0 ? (
              <EmptyState icon={<Briefcase size={28} />} title="No Projects Assigned" description="You don't have any construction projects assigned to manage." />
            ) : (
              projects.slice(0, 5).map((project) => (
                <div key={project.id} style={{ padding: '16px', border: '1px solid var(--color-border)', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)' }}>{project.name}</h4>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '4px 8px',
                      borderRadius: '6px',
                      background: project.status === 'COMPLETED' ? 'rgba(22, 163, 74, 0.1)' : 'rgba(10, 61, 145, 0.1)',
                      color: project.status === 'COMPLETED' ? '#16A34A' : '#0A3D91'
                    }}>
                      {project.status}
                    </span>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                      <span>Timeline Completion</span>
                      <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{project.progress || 0}%</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'var(--color-border)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${project.progress || 0}%`, height: '100%', background: 'var(--color-primary)', borderRadius: '4px' }} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Task Assignment */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '16px' }}>Site Checklist Operations</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {tasks.length === 0 ? (
              <EmptyState icon={<ClipboardList size={28} />} title="Checklist Empty" description="All tasks are completed, or no tasks are assigned for today." />
            ) : (
              tasks.slice(0, 6).map((task) => (
                <div key={task.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid var(--color-border)', borderRadius: '12px' }}>
                  <div>
                    <h5 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)' }}>{task.title}</h5>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Site: {task.site?.name || 'Main Site'}</span>
                  </div>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '4px 8px',
                    borderRadius: '6px',
                    background: task.status === 'DONE' ? 'rgba(22, 163, 74, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                    color: task.status === 'DONE' ? '#16A34A' : '#F59E0B'
                  }}>
                    {task.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
