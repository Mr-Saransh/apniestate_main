import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getBottomNavConfig } from '@/config/navigation.config';

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
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
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid #E2E8F0',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        boxShadow: '0 -4px 16px rgba(15,23,42,0.06)'
      }}
    >
      <div
        className="premium-bottom-nav"
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'stretch',
          height: '60px',
          backgroundColor: '#FFFFFF',
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
                textDecoration: 'none',
                gap: '4px',
                flex: 1,
                height: '100%',
                position: 'relative',
              }}
            >
              {/* Active indicator — top strip */}
              {active && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '24px',
                  height: '3px',
                  backgroundColor: '#2648E7',
                  borderRadius: '0 0 4px 4px',
                }} />
              )}

              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '36px',
                  height: '24px',
                  position: 'relative'
                }}
              >
                <Icon
                  size={20}
                  strokeWidth={active ? 2.5 : 2}
                  color={active ? '#2648E7' : '#64748B'}
                  style={{
                    transition: 'transform 0.2s ease, color 0.2s ease',
                    transform: active ? 'scale(1.05)' : 'scale(1)',
                  }}
                />
              </span>

              <span
                style={{
                  fontSize: '9px',
                  fontWeight: active ? 700 : 500,
                  color: active ? '#2648E7' : '#64748B',
                  transition: 'color 0.2s ease',
                  userSelect: 'none'
                }}
              >
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}
