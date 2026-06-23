import { Badge as DSBadge } from '../design-system/Badge';

interface StatusBadgeProps {
  status: string;
}

const variantMap: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'neutral'> = {
  PLANNING: 'neutral',
  ACTIVE: 'primary',
  ON_HOLD: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'danger',
  TODO: 'neutral',
  IN_PROGRESS: 'primary',
  DONE: 'success',
  BLOCKED: 'danger',
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  DELIVERED: 'success',
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const variant = variantMap[status] || 'primary';
  const label = status.replace(/_/g, ' ');

  return <DSBadge variant={variant}>{label}</DSBadge>;
}
