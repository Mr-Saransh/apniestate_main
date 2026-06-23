import { type ReactNode } from 'react';
import { StatCard as DSStatCard } from '../design-system/Cards';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  trend?: { value: string; direction: 'up' | 'down' };
  color: string;
  bgColor: string;
}

export default function StatCard({ icon, label, value, trend, color, bgColor }: StatCardProps) {
  // We drop the trend prop because the new design system StatCard prioritizes clean, metric-focused visuals
  // without cluttered trend badges unless required by a specific use case.
  return (
    <DSStatCard
      icon={icon}
      label={label}
      value={value}
      color={color}
      bgColor={bgColor}
    />
  );
}
