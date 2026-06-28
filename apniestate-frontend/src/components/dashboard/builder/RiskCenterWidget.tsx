import React from 'react';
import { ShieldAlert, Activity, AlertTriangle, Wind } from 'lucide-react';
import { DonutChartWidget } from '@/components/charts/ChartComponents';

interface ProjectIntelligence {
  name: string;
  riskScore: number;
  riskBreakdown: {
    budget: number;
    timeline: number;
    material: number;
    vendor: number;
    safety: number;
  }
}

interface RiskCenterWidgetProps {
  projects: ProjectIntelligence[];
}

export const RiskCenterWidget: React.FC<RiskCenterWidgetProps> = ({ projects }) => {
  if (!projects || projects.length === 0) return null;

  // Calculate composite portfolio risk
  const totalRiskScore = Math.round(projects.reduce((s, p) => s + (p.riskScore || 0), 0) / projects.length) || 0;
  
  // Aggregate breakdown
  const aggBreakdown = projects.reduce((acc, p) => {
    acc.budget += p.riskBreakdown.budget;
    acc.timeline += p.riskBreakdown.timeline;
    acc.material += p.riskBreakdown.material;
    acc.vendor += p.riskBreakdown.vendor;
    acc.safety += p.riskBreakdown.safety;
    return acc;
  }, { budget: 0, timeline: 0, material: 0, vendor: 0, safety: 0 });

  const totalPoints = aggBreakdown.budget + aggBreakdown.timeline + aggBreakdown.material + aggBreakdown.vendor + aggBreakdown.safety || 1;
  
  const riskChartData = [
    { name: 'Budget Risk', value: Math.round((aggBreakdown.budget / totalPoints) * 100) },
    { name: 'Timeline Risk', value: Math.round((aggBreakdown.timeline / totalPoints) * 100) },
    { name: 'Material Risk', value: Math.round((aggBreakdown.material / totalPoints) * 100) },
    { name: 'Vendor Risk', value: Math.round((aggBreakdown.vendor / totalPoints) * 100) },
    { name: 'Safety Risk', value: Math.round((aggBreakdown.safety / totalPoints) * 100) },
  ];

  const getRiskColor = (score: number) => {
    if (score < 30) return '#10B981';
    if (score < 60) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <div className="premium-widget animate-in">
      <div className="widget-header">
        <h3 className="widget-title">
          <ShieldAlert size={18} color="var(--color-primary)" />
          Portfolio Risk Center
        </h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginTop: '16px' }}>
        
        {/* Composite Score */}
        <div style={{ background: 'var(--color-bg)', padding: '24px', borderRadius: '16px', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Overall Portfolio Risk Score</h4>
          
          <div style={{ 
            width: '120px', height: '120px', borderRadius: '50%', 
            background: `conic-gradient(${getRiskColor(totalRiskScore)} ${totalRiskScore}%, var(--color-border) 0)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'
          }}>
            <div style={{ width: '100px', height: '100px', background: 'var(--color-bg)', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '28px', fontWeight: 800, color: getRiskColor(totalRiskScore) }}>{totalRiskScore}</span>
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>/ 100</span>
            </div>
          </div>
          
          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-muted)', textAlign: 'center' }}>
            {totalRiskScore < 30 ? 'Low Risk Portfolio' : totalRiskScore < 60 ? 'Moderate Risk Detected' : 'High Risk - Immediate Attention Required'}
          </div>
        </div>

        {/* Risk Distribution */}
        <div style={{ background: 'var(--color-bg)', padding: '24px', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '16px' }}>Risk Factor Distribution</h4>
          <DonutChartWidget data={riskChartData.filter(d => d.value > 0)} colors={['#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6', '#10B981']} />
        </div>

      </div>
    </div>
  );
};
