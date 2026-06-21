import {
  ClipboardList,
  Wallet,
  Truck,
  Users,
  BarChart3,
  FileText,
  MessageSquare,
  MapPin,
  Boxes,
} from 'lucide-react';

const pageConfig: Record<string, { icon: React.ComponentType<{ size: number }>; title: string; description: string }> = {
  tasks: { icon: ClipboardList, title: 'Tasks', description: 'Task management module is being built for a better workflow experience.' },
  finance: { icon: Wallet, title: 'Finance', description: 'Financial tracking with expenses, payments, and budget overview.' },
  vendors: { icon: Truck, title: 'Vendors', description: 'Vendor management with contact details and payment tracking.' },
  clients: { icon: Users, title: 'Clients', description: 'Client management and communication module.' },
  reports: { icon: BarChart3, title: 'Reports', description: 'Daily, weekly, and financial reports for your projects.' },
  documents: { icon: FileText, title: 'Documents', description: 'Document management with upload and categorization.' },
  messages: { icon: MessageSquare, title: 'Messages', description: 'Team communication and messaging module.' },
  settings: { icon: ClipboardList, title: 'Settings', description: 'App settings, profile, and preferences.' },
  sites: { icon: MapPin, title: 'Sites', description: 'Site management with location tracking and progress.' },
  materials: { icon: Boxes, title: 'Materials', description: 'Material catalog and request management.' },
};

interface ComingSoonPageProps {
  pageKey: string;
}

export default function ComingSoonPage({ pageKey }: ComingSoonPageProps) {
  const config = pageConfig[pageKey] || {
    icon: ClipboardList,
    title: pageKey.charAt(0).toUpperCase() + pageKey.slice(1),
    description: 'This module is being built.',
  };
  const Icon = config.icon;

  return (
    <div className="coming-soon animate-fade-in">
      <div className="coming-soon-icon">
        <Icon size={40} />
      </div>
      <h2>{config.title}</h2>
      <p>{config.description}</p>
      <p style={{
        marginTop: 'var(--space-4)',
        fontSize: 'var(--font-size-sm)',
        color: 'var(--color-text-muted)',
      }}>
        Coming soon — stay tuned!
      </p>
    </div>
  );
}
