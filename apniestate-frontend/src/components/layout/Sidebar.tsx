import { NavLink } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  FolderKanban,
  MapPin,
  ClipboardList,
  UserCheck,
  Package,
  Boxes,
  Truck,
  Wallet,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Building2,
} from 'lucide-react';

const mainNav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/sites', icon: MapPin, label: 'Sites' },
  { to: '/tasks', icon: ClipboardList, label: 'Tasks' },
  { to: '/attendance', icon: UserCheck, label: 'Attendance' },
];

const managementNav = [
  { to: '/inventory', icon: Package, label: 'Inventory' },
  { to: '/materials', icon: Boxes, label: 'Materials' },
  { to: '/vendors', icon: Truck, label: 'Vendors' },
];

const financeNav = [
  { to: '/finance', icon: Wallet, label: 'Finance' },
  { to: '/documents', icon: FileText, label: 'Documents' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
];

const adminNav = [
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const navSections = [
  { label: 'Main', items: mainNav },
  { label: 'Management', items: managementNav },
  { label: 'Finance', items: financeNav },
  { label: 'Admin', items: adminNav },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const formatRole = (role: string) =>
    role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <aside className="sidebar" id="desktop-sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <Building2 size={20} />
        </div>
        <div className="sidebar-brand-text">
          <span className="sidebar-brand-name">APNI ESTATE</span>
          <span className="sidebar-brand-tagline">Creative Development Together</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navSections.map((section) => (
          <div key={section.label}>
            <div className="sidebar-section-label">{section.label}</div>
            {section.items.map(({ to, icon: Icon, label }) => (
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
                <span className="sidebar-link-text">{label}</span>
              </NavLink>
            ))}
          </div>
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
          <LogOut size={16} style={{ opacity: 0.5, flexShrink: 0 }} className="sidebar-link-text" />
        </div>
      </div>
    </aside>
  );
}
