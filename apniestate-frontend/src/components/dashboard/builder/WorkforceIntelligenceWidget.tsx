import React from 'react';
import { Users, HardHat, TrendingUp, IndianRupee, Activity } from 'lucide-react';
import { LineChartWidget } from '@/components/charts/ChartComponents';

interface WorkforceIntelligenceWidgetProps {
  data: any;
  trend: any[];
}

export const WorkforceIntelligenceWidget: React.FC<WorkforceIntelligenceWidgetProps> = ({ data, trend }) => {
  return (
    <div className="premium-widget animate-in">
      <div className="widget-header">
        <h3 className="widget-title">
          <Users size={18} color="var(--color-primary)" />
          Workforce Intelligence
        </h3>
      </div>

      <div className="project-metric-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '24px' }}>
        <div className="project-metric">
          <span className="project-metric-label">Active Workers Today</span>
          <span className="project-metric-val" style={{ color: '#10B981', fontSize: '20px' }}>
            {data.present} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-muted)' }}>Present</span>
          </span>
        </div>
        <div className="project-metric">
          <span className="project-metric-label">Inactive / Absent</span>
          <span className="project-metric-val" style={{ color: '#EF4444', fontSize: '20px' }}>
            {data.absent} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-muted)' }}>Absent</span>
          </span>
        </div>
        <div className="project-metric">
          <span className="project-metric-label">Productivity Score</span>
          <span className="project-metric-val" style={{ color: '#3B82F6', fontSize: '20px' }}>
            {data.productivityScore}%
          </span>
        </div>
        <div className="project-metric">
          <span className="project-metric-label">Avg. Cost per Worker</span>
          <span className="project-metric-val" style={{ color: '#F59E0B', fontSize: '20px' }}>
            ₹{data.costPerWorker?.toLocaleString() || 0} / day
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        <div style={{ background: 'var(--color-bg)', padding: '20px', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={16} color="#10B981" /> 7-Day Attendance Trend
          </h4>
          <LineChartWidget data={trend} xKey="date" dataKeys={['workers']} colors={['#10B981']} />
        </div>

        <div style={{ background: 'var(--color-bg)', padding: '20px', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IndianRupee size={16} color="#F59E0B" /> 7-Day Labour Cost Trend
          </h4>
          <LineChartWidget data={trend} xKey="date" dataKeys={['cost']} colors={['#F59E0B']} />
        </div>
      </div>
    </div>
  );
};
