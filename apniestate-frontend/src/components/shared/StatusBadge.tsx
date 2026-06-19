interface StatusBadgeProps {
  status: string;
}

const statusStyles: Record<string, string> = {
  PLANNING: 'badge-planning',
  ACTIVE: 'badge-active',
  ON_HOLD: 'badge-on-hold',
  COMPLETED: 'badge-completed',
  CANCELLED: 'badge-cancelled',
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const className = statusStyles[status] || 'badge-planning';
  const label = status.replace(/_/g, ' ');

  return (
    <span className={`badge ${className}`}>
      {label}
    </span>
  );
}
