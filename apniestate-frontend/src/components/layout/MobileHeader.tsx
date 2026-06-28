import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Bell } from 'lucide-react';
import Logo from '@/components/shared/Logo';

export default function MobileHeader() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const getPageTitle = (path: string) => {
    if (path.startsWith('/dashboard') || path === '/') return 'Dashboard';
    if (path.startsWith('/projects')) return 'Projects';
    if (path.startsWith('/tasks')) return 'Tasks';
    if (path.startsWith('/attendance')) return 'Attendance';
    if (path.startsWith('/inventory')) return 'Inventory';
    if (path.startsWith('/materials')) return 'Materials';
    if (path.startsWith('/finance')) return 'Finance';
    if (path.startsWith('/documents')) return 'Documents';
    if (path.startsWith('/sites')) return 'Sites';
    if (path.startsWith('/vendors')) return 'Vendors';
    if (path.startsWith('/reports')) return 'Reports';
    if (path.startsWith('/settings')) return 'Settings';
    if (path.startsWith('/notifications')) return 'Notifications';
    return 'Apni Estate';
  };

  return (
    <header className="mobile-header premium-header" id="mobile-header">
      <div className="mobile-header-left" onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center' }}>
        <Logo size="sm" />
      </div>

      <div className="mobile-header-center">
        <span className="mobile-header-title-minimal">
          {getPageTitle(location.pathname)}
        </span>
      </div>

      <div className="mobile-header-right">
        <button
          className="mobile-icon-btn"
          aria-label="Notifications"
          onClick={() => navigate('/notifications')}
        >
          <Bell size={22} color="var(--color-text)" />
          <span className="notification-dot-minimal" />
        </button>

        <button
          className="mobile-avatar-btn"
          aria-label="Profile"
          onClick={() => navigate('/settings')}
        >
          <div className="avatar-minimal">
            {user ? getInitials(user.name) : '?'}
          </div>
        </button>
      </div>
    </header>
  );
}
