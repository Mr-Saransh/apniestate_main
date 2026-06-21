import { type ReactNode } from 'react';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  trend?: { value: string; direction: 'up' | 'down' };
  color: string;
  bgColor: string;
}

export default function StatCard({ icon, label, value, trend, color, bgColor }: StatCardProps) {
  return (
    <div className="stat-card" id={`stat-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="stat-card-header">
        <div className="stat-card-icon" style={{ background: bgColor, color }}>
          {icon}
        </div>
        {trend && (
          <div className={`stat-card-trend ${trend.direction}`}>
            <span>{trend.direction === 'up' ? '↑' : '↓'}</span>
            <span>{trend.value}</span>
          </div>
        )}
      </div>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-label">{label}</div>
    </div>
  );
}
