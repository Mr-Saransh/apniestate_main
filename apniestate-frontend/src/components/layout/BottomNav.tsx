import { NavLink, useLocation } from 'react-router-dom';
import { Colors } from '../design-system/Colors';
import { useAuth } from '@/context/AuthContext';
import { getBottomNavConfig } from '@/config/navigation.config';

export function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();
  const navItems = getBottomNavConfig(user?.role || 'SITE_SUPERVISOR');

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="bottom-nav-container">
      <div className="premium-bottom-nav">
      {navItems.map(({ to, icon: Icon, label }) => {
        const active = isActive(to);
        return (
          <NavLink
            key={to}
            to={to}
            className={`premium-nav-item ${active ? 'active' : ''}`}
          >
            <span className="bottom-nav-icon-wrapper">
              <Icon
                size={20}
                strokeWidth={active ? 2.5 : 2}
                color={active ? Colors.goldAccent : 'rgba(255, 255, 255, 0.6)'}
                style={{
                  transition: 'transform 0.2s ease, color 0.2s ease',
                  transform: active ? 'scale(1.05)' : 'scale(1)',
                }}
              />
            </span>
            <span className="bottom-nav-label">
              {label}
            </span>
          </NavLink>
        );
      })}
      </div>
    </div>
  );
}
