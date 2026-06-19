import type { ReactNode } from 'react';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  bgColor?: string;
}

export default function StatCard({ icon, label, value, subtitle, color, bgColor }: StatCardProps) {
  return (
    <div
      className="stat-card"
      style={{
        '--stat-color': color || 'var(--color-primary)',
        '--stat-bg': bgColor || 'var(--color-primary-50)',
      } as React.CSSProperties}
    >
      <div className="stat-card-icon">{icon}</div>
      <div className="stat-card-content">
        <div className="stat-card-label">{label}</div>
        <div className="stat-card-value">{value}</div>
        {subtitle && <div className="stat-card-subtitle">{subtitle}</div>}
      </div>
    </div>
  );
}
