import { NavLink, useLocation } from 'react-router-dom';
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

  const getBadgeCount = (label: string) => {
    return 0;
  };

  return (
    <div className="bottom-nav-container" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000, background: '#FFFFFF', borderTop: '1px solid #E2E8F0', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="premium-bottom-nav" style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', height: '64px', background: '#FFFFFF' }}>
        {navItems.map(({ to, icon: Icon, label }) => {
          const active = isActive(to);
          const badgeCount = getBadgeCount(label);
          return (
            <NavLink
              key={to}
              to={to}
              className={`premium-nav-item ${active ? 'active' : ''}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
                gap: '4px',
                flex: 1,
                height: '100%',
                position: 'relative'
              }}
            >
              <span className="bottom-nav-icon-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '24px', position: 'relative' }}>
                <Icon
                  size={20}
                  strokeWidth={active ? 2.5 : 2}
                  color={active ? '#1D4ED8' : '#64748B'}
                  style={{
                    transition: 'transform 0.2s ease, color 0.2s ease',
                    transform: active ? 'scale(1.05)' : 'scale(1)',
                  }}
                />
                {badgeCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-8px',
                    background: '#EF4444',
                    color: '#FFFFFF',
                    borderRadius: '50%',
                    width: '16px',
                    height: '16px',
                    fontSize: '10px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #FFFFFF'
                  }}>
                    {badgeCount}
                  </span>
                )}
              </span>
              <span className="bottom-nav-label" style={{ fontSize: '11px', color: active ? '#1D4ED8' : '#64748B', fontWeight: active ? 700 : 500 }}>
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}
