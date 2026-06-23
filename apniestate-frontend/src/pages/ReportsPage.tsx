import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Calendar, ClipboardCheck, Boxes, MapPin, Printer } from 'lucide-react';
import { apiClient } from '@/api/client';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

interface ReportData {
  finance: {
    total_expenses: number;
    total_payments: number;
    pending_expenses: number;
    approved_expenses: number;
    receivable: number;
    payable: number;
    cash_flow: number;
    by_category: { category: string; amount: number }[];
  };
  projects: {
    total: number;
    active: number;
    completed: number;
    avg_progress: number;
    projects: any[];
  };
  attendance: {
    total_records: number;
    present: number;
    absent: number;
    attendance_rate: number;
  };
  workforce: {
    total_workers: number;
    active_workers: number;
    assigned_to_sites: number;
    utilization_rate: number;
    total_daily_wage: number;
    estimated_monthly_wage: number;
    by_trade: { trade: string; count: number }[];
  };
}

export default function ReportsPage() {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReports() {
      try {
        const [financeRes, projectsRes, attendanceRes, workforceRes] = await Promise.all([
          apiClient.get<any>('/reports?type=finance'),
          apiClient.get<any>('/reports?type=projects'),
          apiClient.get<any>('/reports?type=attendance'),
          apiClient.get<any>('/reports?type=workforce')
        ]);

        setReport({
          finance: financeRes.data,
          projects: projectsRes.data,
          attendance: attendanceRes.data,
          workforce: workforceRes.data
        });
      } catch (err) {
        console.error('Failed to compile reports data', err);
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <LoadingSpinner size="lg" />;

  const finance = report?.finance;
  const projects = report?.projects;
  const attendance = report?.attendance;
  const workforce = report?.workforce;

  return (
    <div className="animate-fade-in texture-grain" style={{ paddingBottom: 'var(--space-12)' }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
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
            {projects?.total || 0}
          </h2>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            {projects?.active || 0} active, {projects?.completed || 0} completed
          </p>
        </div>

        <div className="card-3d card-3d-primary">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--font-size-sm)', opacity: 0.9 }}>Total Expenditures</span>
            <TrendingUp size={20} />
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 'var(--font-weight-bold)', marginTop: '8px' }}>
            ₹{(finance?.total_expenses || 0).toLocaleString('en-IN')}
          </h2>
          <p style={{ fontSize: 'var(--font-size-xs)', opacity: 0.8, marginTop: '4px' }}>
            Payables: ₹{(finance?.payable || 0).toLocaleString('en-IN')}
          </p>
        </div>

        <div className="card-3d">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--color-text-secondary)' }}>
            <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>Average Progress</span>
            <ClipboardCheck size={20} color="var(--color-success)" />
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 'var(--font-weight-bold)', marginTop: '8px' }}>
            {projects?.avg_progress || 0}%
          </h2>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            Across all structured projects
          </p>
        </div>

        <div className="card-3d">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--color-text-secondary)' }}>
            <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>Workforce Present</span>
            <Users size={20} color="var(--color-cta)" />
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 'var(--font-weight-bold)', marginTop: '8px' }}>
            {attendance?.attendance_rate || 0}%
          </h2>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            {workforce?.active_workers || 0} active workers in registry
          </p>
        </div>

      </div>

      {/* Analytics Breakdown Graphs & Tables (Tactile 3D Layout) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        
        {/* Productivity Audit Card */}
        <div className="card-3d" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-bold)' }}>Productivity Audit</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)', marginBottom: '4px' }}>
                <span>Workforce Attendance Rate</span>
                <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>{attendance?.attendance_rate || 0}%</span>
              </div>
              <div className="progress-bar" style={{ height: '10px' }}>
                <div className="progress-bar-fill" style={{ width: `${attendance?.attendance_rate || 0}%`, background: 'var(--color-cta)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)', marginBottom: '4px' }}>
                <span>Workforce Utilization Rate</span>
                <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>{workforce?.utilization_rate || 0}%</span>
              </div>
              <div className="progress-bar" style={{ height: '10px' }}>
                <div className="progress-bar-fill" style={{ width: `${workforce?.utilization_rate || 0}%`, background: 'var(--color-success)' }} />
              </div>
            </div>
          </div>

          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', lineHeight: '1.5', padding: '10px', background: 'var(--color-bg-warm)', borderRadius: 'var(--radius-md)', marginTop: 'auto' }}>
            <strong>Workforce Utilization:</strong> {workforce?.assigned_to_sites || 0} of {workforce?.active_workers || 0} active workers are assigned to active sites. Make sure all workers are assigned to avoid idle daily rates.
          </div>
        </div>

        {/* Cost Optimization Card */}
        <div className="card-3d" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-bold)' }}>Cost Allocation Audit</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {finance?.by_category.map((cat) => (
              <div key={cat.category} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border-light)', paddingBottom: '8px' }}>
                <span style={{ textTransform: 'capitalize' }}>{cat.category.toLowerCase()}</span>
                <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>₹{cat.amount.toLocaleString('en-IN')}</span>
              </div>
            ))}
            {(!finance?.by_category || finance.by_category.length === 0) && (
              <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No categorical expenses recorded.</span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'var(--color-primary-50)', borderRadius: 'var(--radius-lg)', color: 'var(--color-primary)', fontSize: 'var(--font-size-xs)', marginTop: 'auto' }}>
            <Boxes size={18} />
            <span>Categorical expenses map directly against logged invoice items and site expenditures.</span>
          </div>
        </div>
      </div>

      <div className="card-3d">
        <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--space-4)' }}>Workforce Skill Distribution</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          {workforce?.by_trade.map((t) => (
            <div key={t.trade} style={{ background: 'var(--color-bg-warm)', padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)', minWidth: '150px' }}>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>{t.trade}</div>
              <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'bold', color: 'var(--color-text)' }}>{t.count} workers</div>
            </div>
          ))}
          {(!workforce?.by_trade || workforce.by_trade.length === 0) && (
            <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No workers registered in database.</span>
          )}
        </div>
      </div>
    </div>
  );
}

