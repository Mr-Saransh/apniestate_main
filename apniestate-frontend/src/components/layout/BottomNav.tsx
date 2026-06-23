import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  FolderKanban,
  ClipboardList,
  Package,
  Menu,
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/tasks', icon: ClipboardList, label: 'Work' },
  { to: '/inventory', icon: Package, label: 'Inventory' },
  { to: '/more', icon: Menu, label: 'Management' },
];

export default function BottomNav() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="bottom-nav-container">
      <nav className="bottom-nav premium-bottom-nav" id="bottom-nav">
        {navItems.map(({ to, icon: Icon, label }) => {
          const active = isActive(to);
          return (
            <NavLink
              key={to}
              to={to}
              className={`bottom-nav-item premium-nav-item ${active ? 'active' : ''}`}
              end={to === '/dashboard'}
            >
              <span className="bottom-nav-icon">
                <Icon size={24} strokeWidth={active ? 2.5 : 2} color={active ? "var(--color-primary)" : "var(--color-text-muted)"} />
              </span>
              <span className="bottom-nav-label">{label}</span>
              {active && <span className="bottom-nav-indicator" />}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
