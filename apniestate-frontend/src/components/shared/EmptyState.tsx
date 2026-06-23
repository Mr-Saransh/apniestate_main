import { type ReactNode } from 'react';
import { EmptyStateCard } from '../design-system/Cards';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <EmptyStateCard
      icon={icon}
      title={title}
      description={description}
      action={action}
    />
  );
}
