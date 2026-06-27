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
    <div
      className="bottom-nav-container"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: Colors.primaryBlue,
        borderTop: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.15)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        height: 'calc(64px + env(safe-area-inset-bottom, 0px))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        pointerEvents: 'auto',
      }}
    >
      {navItems.map(({ to, icon: Icon, label }) => {
        const active = isActive(to);
        return (
          <NavLink
            key={to}
            to={to}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: `${100 / navItems.length}%`,
              height: '100%',
              textDecoration: 'none',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '48px',
                height: '28px',
                borderRadius: '14px',
                backgroundColor: active ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                marginBottom: '2px',
              }}
            >
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
            <span
              style={{
                fontSize: '11px',
                fontWeight: active ? 600 : 500,
                color: active ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)',
                letterSpacing: '-0.01em',
                transition: 'color 0.2s ease',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100%',
                padding: '0 4px',
              }}
            >
              {label}
            </span>
          </NavLink>
        );
      })}
    </div>
  );
}
