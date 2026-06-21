import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  FolderKanban,
  ClipboardList,
  Package,
  MoreHorizontal,
} from 'lucide-react';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/tasks', icon: ClipboardList, label: 'Work' },
  { to: '/inventory', icon: Package, label: 'Inventory' },
  { to: '/more', icon: MoreHorizontal, label: 'More' },
];

export default function BottomNav() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bottom-nav" id="bottom-nav">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={`bottom-nav-item ${isActive(to) ? 'active' : ''}`}
          end={to === '/'}
        >
          <span className="bottom-nav-icon">
            <Icon size={22} strokeWidth={isActive(to) ? 2.5 : 2} />
          </span>
          <span className="bottom-nav-label">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
