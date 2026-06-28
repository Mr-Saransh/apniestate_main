import React from 'react';
import { AlertCircle, TrendingDown, Clock, ShieldAlert, ArrowRight } from 'lucide-react';

interface DecisionCard {
  id: string;
  title: string;
  reason: string;
  suggestedAction: string;
  ctaText: string;
  ctaLink: string;
  severity: 'error' | 'warning' | 'info';
}

interface ExecutiveDecisionWidgetProps {
  cards: DecisionCard[];
}

export const ExecutiveDecisionWidget: React.FC<ExecutiveDecisionWidgetProps> = ({ cards }) => {
  if (!cards || cards.length === 0) {
    return (
      <div className="premium-widget animate-in" style={{ alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <ShieldAlert size={32} color="var(--color-text-muted)" style={{ marginBottom: '12px', opacity: 0.5 }} />
        <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text)' }}>No Critical Decisions Pending</h3>
        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>All projects and operations are running smoothly within acceptable thresholds.</p>
      </div>
    );
  }

  const getIcon = (severity: string) => {
    switch (severity) {
      case 'error': return <AlertCircle size={20} color="#EF4444" />;
      case 'warning': return <Clock size={20} color="#F59E0B" />;
      default: return <TrendingDown size={20} color="#3B82F6" />;
    }
  };

  return (
    <div className="premium-widget animate-in">
      <div className="widget-header">
        <h3 className="widget-title">
          <AlertCircle size={18} color="var(--color-primary)" />
          Executive Decision Center
        </h3>
      </div>
      <div className="decision-grid">
        {cards.map(card => (
          <div key={card.id} className={`decision-card ${card.severity}`}>
            <div className="decision-title">
              {getIcon(card.severity)}
              <span>{card.title}</span>
            </div>
            <div className="decision-reason">
              <strong>Reason:</strong> {card.reason}
            </div>
            <div className="decision-action">
              <strong>Action:</strong> {card.suggestedAction}
            </div>
            <a href={card.ctaLink} className={`decision-cta ${card.severity}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {card.ctaText} <ArrowRight size={14} />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};
