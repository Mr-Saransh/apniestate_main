import {
  ClipboardList,
  Wallet,
  Truck,
  Users,
  FileBarChart,
  FileText,
  MessageSquare,
  Settings,
} from 'lucide-react';

const pageConfig: Record<string, { icon: typeof ClipboardList; title: string; description: string }> = {
  tasks: {
    icon: ClipboardList,
    title: 'Tasks',
    description: 'Create, assign, and track tasks across your construction projects. Smart task management is coming soon.',
  },
  finance: {
    icon: Wallet,
    title: 'Finance',
    description: 'Track budgets, expenses, invoices, and payments. Financial management module is under development.',
  },
  vendors: {
    icon: Truck,
    title: 'Vendors',
    description: 'Manage vendor relationships, purchase orders, and deliveries. Vendor management is coming soon.',
  },
  clients: {
    icon: Users,
    title: 'Clients',
    description: 'Manage client information, contracts, and communications. Client portal is being built.',
  },
  reports: {
    icon: FileBarChart,
    title: 'Reports',
    description: 'Generate detailed reports on project progress, finances, and workforce analytics.',
  },
  documents: {
    icon: FileText,
    title: 'Documents',
    description: 'Store and manage project documents, blueprints, contracts, and approvals.',
  },
  messages: {
    icon: MessageSquare,
    title: 'Messages',
    description: 'Team messaging and notifications for seamless project communication.',
  },
  settings: {
    icon: Settings,
    title: 'Settings',
    description: 'Configure your workspace, notifications, integrations, and account preferences.',
  },
};

interface ComingSoonPageProps {
  pageKey: string;
}

export default function ComingSoonPage({ pageKey }: ComingSoonPageProps) {
  const config = pageConfig[pageKey] || {
    icon: Settings,
    title: 'Coming Soon',
    description: 'This feature is under development.',
  };
  const Icon = config.icon;

  return (
    <div className="coming-soon animate-fade-in">
      <div className="coming-soon-icon">
        <Icon size={48} />
      </div>
      <h2>{config.title}</h2>
      <p>{config.description}</p>
      <div
        style={{
          marginTop: 'var(--space-6)',
          padding: 'var(--space-3) var(--space-5)',
          background: 'var(--color-primary-50)',
          borderRadius: 'var(--radius-full)',
          fontSize: 'var(--font-size-sm)',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--color-primary)',
        }}
      >
        🚧 Under Development
      </div>
    </div>
  );
}
