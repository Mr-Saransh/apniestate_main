interface StatusBadgeProps {
  status: string;
}

const statusMap: Record<string, string> = {
  PLANNING: 'planning',
  ACTIVE: 'active',
  ON_HOLD: 'on-hold',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  TODO: 'planning',
  IN_PROGRESS: 'active',
  DONE: 'completed',
  BLOCKED: 'cancelled',
  PENDING: 'on-hold',
  APPROVED: 'active',
  REJECTED: 'cancelled',
  DELIVERED: 'completed',
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const badgeClass = statusMap[status] || 'planning';
  const label = status.replace(/_/g, ' ');

  return (
    <span className={`badge badge-${badgeClass}`}>
      {label}
    </span>
  );
}
