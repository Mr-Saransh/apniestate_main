import { NavLink } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Logo from '@/components/shared/Logo';
import { LogOut } from 'lucide-react';
import { getSidebarConfig } from '@/config/navigation.config';

export default function Sidebar() {
  const { user, logout, hasPermission } = useAuth();

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const formatRole = (role: string) =>
    role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const checkAccess = (permission?: string) => {
    if (!permission) return true;
    return hasPermission(permission);
  };

  const navSections = getSidebarConfig(user?.role || 'SITE_SUPERVISOR');

  const filteredNavSections = navSections.map(section => ({
    ...section,
    items: section.items.filter(item => checkAccess(item.to))
  })).filter(section => section.items.length > 0);

  return (
    <aside className="sidebar" id="desktop-sidebar">
      {/* Brand */}
      <div className="sidebar-brand" style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-4) 0' }}>
        <Logo size="lg" />
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {filteredNavSections.map((section) => (
          <div key={section.label}>
            <div className="sidebar-section-label">{section.label}</div>
            {section.items.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/dashboard'}
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
