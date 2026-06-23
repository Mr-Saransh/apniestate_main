import { NavLink } from 'react-router-dom';
import {
  Wallet,
  FileText,
  BarChart3,
  Truck,
  Users,
  Settings,
  MapPin,
  UserCheck,
  Boxes,
  Bell,
  Calendar,
  Layers,
  ClipboardList
} from 'lucide-react';

const moreItems = [
  { to: '/finance', icon: Wallet, label: 'Expenses', color: '#059669', bg: '#ECFDF5' },
  { to: '/invoices', icon: FileText, label: 'Invoices', color: '#8B5CF6', bg: '#F5F3FF' },
  { to: '/payments', icon: Wallet, label: 'Payments', color: '#0D9488', bg: '#CCFBF1' },
  { to: '/budgets', icon: BarChart3, label: 'Budgets', color: '#EA580C', bg: '#FFEDD5' },
  { to: '/vendors', icon: Truck, label: 'Vendors', color: '#D97706', bg: '#FFFBEB' },
  { to: '/workers', icon: Users, label: 'Workers', color: '#10B981', bg: '#E6F4EA' },
  { to: '/contractors', icon: Layers, label: 'Contractors', color: '#9333EA', bg: '#F3E8FF' },
  { to: '/leaves', icon: Calendar, label: 'Leaves', color: '#F59E0B', bg: '#FEF3C7' },
  { to: '/dpr', icon: ClipboardList, label: 'DPR Logs', color: '#475569', bg: '#F1F5F9' },
  { to: '/attendance', icon: UserCheck, label: 'Attendance', color: '#1B6EF3', bg: 'rgba(27,110,243,0.06)' },
  { to: '/materials', icon: Boxes, label: 'Materials', color: '#7C3AED', bg: '#F5F3FF' },
  { to: '/sites', icon: MapPin, label: 'Sites', color: '#0EA5E9', bg: '#F0F9FF' },
  { to: '/documents', icon: FileText, label: 'Documents', color: '#6366F1', bg: '#EEF2FF' },
  { to: '/reports', icon: BarChart3, label: 'Reports', color: '#EC4899', bg: '#FDF2F8' },
  { to: '/notifications', icon: Bell, label: 'Notifications', color: '#EF4444', bg: '#FEF2F2' },
  { to: '/users', icon: Users, label: 'Users', color: '#14B8A6', bg: '#F0FDFA' },
  { to: '/settings', icon: Settings, label: 'Settings', color: '#64748B', bg: '#F8FAFC' },
];

import { useAuth } from '@/context/AuthContext';

export default function MorePage() {
  const { hasPermission, user } = useAuth();

  const checkAccess = (path: string) => {
    if (user?.role === 'ADMIN') return true;
    switch (path) {
      case '/finance': return hasPermission('finance.read');
      case '/invoices': return hasPermission('invoices.read');
      case '/payments': return hasPermission('payments.read');
      case '/budgets': return hasPermission('budgets.read');
      case '/vendors': return hasPermission('vendors.read');
      case '/workers': return hasPermission('workers.read');
      case '/contractors': return hasPermission('contractors.read');
      case '/leaves': return hasPermission('leaves.read');
      case '/attendance': return hasPermission('attendance.read');
      case '/materials': return hasPermission('materials.read');
      case '/sites': return hasPermission('sites.read');
      case '/documents': return hasPermission('documents.read');
      case '/reports': return hasPermission('reports.read');
      case '/users': return hasPermission('users.read');
      case '/dpr': return true;
      case '/notifications': return true;
      case '/settings': return true;
      default: return false;
    }
  };

  const availableItems = moreItems.filter(item => checkAccess(item.to));

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Management</h1>
          <p className="page-subtitle">All ERP business modules and configuration settings</p>
        </div>
      </div>

      <div className="more-grid">
        {availableItems.map(({ to, icon: Icon, label, color, bg }) => (
          <NavLink key={to} to={to} className="more-item" id={`more-${label.toLowerCase()}`}>
            <div className="more-item-icon" style={{ background: bg, color }}>
              <Icon size={24} />
            </div>
            <span className="more-item-label">{label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
}

