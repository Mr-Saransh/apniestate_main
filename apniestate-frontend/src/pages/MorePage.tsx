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
} from 'lucide-react';

const moreItems = [
  { to: '/finance', icon: Wallet, label: 'Finance', color: '#059669', bg: '#ECFDF5' },
  { to: '/vendors', icon: Truck, label: 'Vendors', color: '#D97706', bg: '#FFFBEB' },
  { to: '/attendance', icon: UserCheck, label: 'Attendance', color: '#1B6EF3', bg: 'rgba(27,110,243,0.06)' },
  { to: '/materials', icon: Boxes, label: 'Materials', color: '#7C3AED', bg: '#F5F3FF' },
  { to: '/sites', icon: MapPin, label: 'Sites', color: '#0EA5E9', bg: '#F0F9FF' },
  { to: '/documents', icon: FileText, label: 'Documents', color: '#6366F1', bg: '#EEF2FF' },
  { to: '/reports', icon: BarChart3, label: 'Reports', color: '#EC4899', bg: '#FDF2F8' },
  { to: '/notifications', icon: Bell, label: 'Notifications', color: '#EF4444', bg: '#FEF2F2' },
  { to: '/users', icon: Users, label: 'Users', color: '#14B8A6', bg: '#F0FDFA' },
  { to: '/settings', icon: Settings, label: 'Settings', color: '#64748B', bg: '#F8FAFC' },
];

export default function MorePage() {
  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">More</h1>
          <p className="page-subtitle">All modules and settings</p>
        </div>
      </div>

      <div className="more-grid">
        {moreItems.map(({ to, icon: Icon, label, color, bg }) => (
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
