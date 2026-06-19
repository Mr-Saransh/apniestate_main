import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  FolderKanban,
  MapPin,
  ClipboardList,
  Wallet,
  Truck,
  Users,
  FileBarChart,
  FileText,
  MessageSquare,
  Settings,
  LogOut,
  Building2,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/site-management', icon: MapPin, label: 'Site Management' },
  { to: '/tasks', icon: ClipboardList, label: 'Tasks' },
  { to: '/finance', icon: Wallet, label: 'Finance' },
  { to: '/vendors', icon: Truck, label: 'Vendors' },
  { to: '/clients', icon: Users, label: 'Clients' },
  { to: '/reports', icon: FileBarChart, label: 'Reports' },
  { to: '/documents', icon: FileText, label: 'Documents' },
  { to: '/messages', icon: MessageSquare, label: 'Messages' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ collapsed }: SidebarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const formatRole = (role: string) =>
    role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <Building2 size={22} />
        </div>
        <div className="sidebar-brand-text">
          <span className="sidebar-brand-name">APNI ESTATE</span>
          <span className="sidebar-brand-tagline">Creative Development Together</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <span className="sidebar-link-icon">
              <Icon size={20} />
            </span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="sidebar-footer">
        <div className="sidebar-user" onClick={logout} title="Logout">
          <div className="sidebar-user-avatar">
            {user ? getInitials(user.name) : '?'}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name || 'User'}</div>
            <div className="sidebar-user-role">
              {user ? formatRole(user.role) : ''}
            </div>
          </div>
          <LogOut size={16} style={{ opacity: 0.6, flexShrink: 0 }} />
        </div>
      </div>
    </aside>
  );
}
