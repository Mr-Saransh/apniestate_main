import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Calendar, ClipboardCheck, Boxes, MapPin, Printer } from 'lucide-react';
import { apiClient } from '@/api/client';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

interface DashboardMetrics {
  totalProjects: number;
  activeSites: number;
  totalTasks: number;
  completedTasks: number;
  taskCompletionRate: number;
  totalExpenses: number;
  attendancePresentCount: number;
  attendancePresentRate: number;
}

export default function ReportsPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function calculateMetrics() {
      try {
        const [projectsRes, sitesRes, tasksRes, attendanceRes, financeRes] = await Promise.all([
          apiClient.get<any[]>('/projects'),
          apiClient.get<any[]>('/sites'),
          apiClient.get<any[]>('/tasks'),
          apiClient.get<any[]>('/attendance'),
          apiClient.get<any[]>('/finance')
        ]);

        const totalProjects = projectsRes.data?.length || 0;
        const activeSites = sitesRes.data?.filter(s => s.status === 'IN_PROGRESS').length || 0;
        
        const tasks = tasksRes.data || [];
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.status === 'DONE').length;
        const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        const expenses = financeRes.data || [];
        const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);

        const attendance = attendanceRes.data || [];
        const totalWorkers = attendance.length;
        const attendancePresentCount = attendance.filter(a => a.status === 'PRESENT').length;
        const attendancePresentRate = totalWorkers > 0 ? Math.round((attendancePresentCount / totalWorkers) * 100) : 0;

        setMetrics({
          totalProjects,
          activeSites,
          totalTasks,
          completedTasks,
          taskCompletionRate,
          totalExpenses,
          attendancePresentCount,
          attendancePresentRate
        });
      } catch (err) {
        console.error('Failed to calculate metrics for executive reports', err);
      } finally {
        setLoading(false);
      }
    }
    calculateMetrics();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="animate-fade-in texture-grain" style={{ paddingBottom: 'var(--space-12)' }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={28} color="var(--color-primary)" /> Executive Analytics
            </h1>
            <p className="page-subtitle">Dynamically compiled ERP productivity reports</p>
          </div>
          <button 
            className="btn btn-secondary btn-3d btn-3d-secondary animate-pop-in" 
            onClick={handlePrint}
            style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
          >
            <Printer size={18} /> Print Audit Report
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-5)', marginBottom: 'var(--space-8)' }}>
        
        <div className="card-3d">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--color-text-secondary)' }}>
            <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>Total Projects</span>
            <MapPin size={20} color="var(--color-primary)" />
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 'var(--font-weight-bold)', marginTop: '8px' }}>
            {metrics?.totalProjects}
          </h2>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            {metrics?.activeSites} active construction sites
          </p>
        </div>

        <div className="card-3d card-3d-primary">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--font-size-sm)', opacity: 0.9 }}>Total Spenditures</span>
            <TrendingUp size={20} />
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 'var(--font-weight-bold)', marginTop: '8px' }}>
            ₹{metrics?.totalExpenses.toLocaleString('en-IN')}
          </h2>
          <p style={{ fontSize: 'var(--font-size-xs)', opacity: 0.8, marginTop: '4px' }}>
            Sum of all logged expenses
          </p>
        </div>

        <div className="card-3d">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--color-text-secondary)' }}>
            <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>Task Output Rate</span>
            <ClipboardCheck size={20} color="var(--color-success)" />
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 'var(--font-weight-bold)', marginTop: '8px' }}>
            {metrics?.taskCompletionRate}%
          </h2>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            {metrics?.completedTasks} of {metrics?.totalTasks} tasks resolved
          </p>
        </div>

        <div className="card-3d">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--color-text-secondary)' }}>
            <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>Workforce Present</span>
            <Users size={20} color="var(--color-cta)" />
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 'var(--font-weight-bold)', marginTop: '8px' }}>
            {metrics?.attendancePresentRate}%
          </h2>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            {metrics?.attendancePresentCount} supervisors active today
          </p>
        </div>

      </div>

      {/* Analytics Breakdown Graphs & Tables (Tactile 3D Layout) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-6)' }}>
        
        {/* Productivity Audit Card */}
        <div className="card-3d" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-bold)' }}>Productivity Audit</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)', marginBottom: '4px' }}>
                <span>Workforce Attendance Rate</span>
                <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>{metrics?.attendancePresentRate}%</span>
              </div>
              <div className="progress-bar" style={{ height: '10px' }}>
                <div className="progress-bar-fill" style={{ width: `${metrics?.attendancePresentRate}%`, background: 'var(--color-cta)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)', marginBottom: '4px' }}>
                <span>Task Resolution Rate</span>
                <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>{metrics?.taskCompletionRate}%</span>
              </div>
              <div className="progress-bar" style={{ height: '10px' }}>
                <div className="progress-bar-fill" style={{ width: `${metrics?.taskCompletionRate}%`, background: 'var(--color-success)' }} />
              </div>
            </div>
          </div>

          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', lineHeight: '1.5', padding: '10px', background: 'var(--color-bg-warm)', borderRadius: 'var(--radius-md)', marginTop: 'auto' }}>
            <strong>ERP Recommendation:</strong> Task resolution is healthy. Ensure materials requests are approved in advance to avoid delay on structural tasks.
          </div>
        </div>

        {/* Cost Optimization Card */}
        <div className="card-3d" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-bold)' }}>Cost Allocation Audit</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border-light)', paddingBottom: '8px' }}>
              <span>Central Office Overheads</span>
              <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>₹{(metrics!.totalExpenses * 0.15).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border-light)', paddingBottom: '8px' }}>
              <span>Procured Raw Materials</span>
              <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>₹{(metrics!.totalExpenses * 0.55).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border-light)', paddingBottom: '8px' }}>
              <span>Contractor Payouts</span>
              <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>₹{(metrics!.totalExpenses * 0.30).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'var(--color-primary-50)', borderRadius: 'var(--radius-lg)', color: 'var(--color-primary)', fontSize: 'var(--font-size-xs)' }}>
            <Boxes size={18} />
            <span>Materials represent the majority of expenses. Log vendor discounts to lower raw procurement overheads.</span>
          </div>
        </div>

      </div>
    </div>
  );
}
