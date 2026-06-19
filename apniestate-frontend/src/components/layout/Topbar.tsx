import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Search, Bell, Menu, LogOut, User, ChevronDown } from 'lucide-react';

interface TopbarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Topbar({ collapsed, onToggle }: TopbarProps) {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const formatRole = (role: string) =>
    role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <header className={`topbar ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="topbar-left">
        <button className="topbar-toggle" onClick={onToggle} aria-label="Toggle sidebar">
          <Menu size={20} />
        </button>

        <div className="topbar-search">
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="form-input"
              placeholder="Search project, task, vendor..."
              id="global-search"
            />
          </div>
        </div>
      </div>

      <div className="topbar-right">
        <button className="topbar-icon-btn" aria-label="Notifications" id="notification-btn">
          <Bell size={20} />
          <span className="notification-dot" />
        </button>

        <div className="topbar-user" ref={dropdownRef} onClick={() => setShowDropdown(!showDropdown)}>
          <div className="topbar-user-info">
            <div className="topbar-user-name">{user?.name || 'User'}</div>
            <div className="topbar-user-role">
              {user ? formatRole(user.role) : ''}
            </div>
          </div>
          <div className="avatar">
            {user ? getInitials(user.name) : '?'}
          </div>
          <ChevronDown size={16} style={{ color: 'var(--color-text-muted)' }} />

          {showDropdown && (
            <div className="topbar-dropdown">
              <button className="topbar-dropdown-item" id="profile-btn">
                <User size={16} />
                <span>Profile</span>
              </button>
              <div className="topbar-dropdown-divider" />
              <button className="topbar-dropdown-item danger" onClick={logout} id="logout-btn">
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
