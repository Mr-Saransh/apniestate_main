import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Logo from '@/components/shared/Logo';
import { LogOut, ChevronDown, Building2, ArrowLeftRight } from 'lucide-react';
import { getSidebarConfig } from '@/config/navigation.config';
import { apiClient } from '@/api/client';

export default function Sidebar() {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Fetch company name
    apiClient.get<any>('/companies/me')
      .then(res => {
        if (res.success && res.data) {
          setCompanyName(res.data.name || '');
        }
      })
      .catch(() => {});

    // Fetch unread notification count
    apiClient.get<any>('/notifications?unread=true&limit=1')
      .then(res => {
        if (res.success && res.data) {
          const count = Array.isArray(res.data) ? res.data.length : (res.data.unreadCount || 0);
          setUnreadCount(count);
        }
      })
      .catch(() => {});
  }, []);

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const formatRole = (role: string) =>
    role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const checkAccess = (permission?: string) => {
    if (!permission) return true;
    return hasPermission(permission);
  };

  const toggleSection = (label: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  const navSections = getSidebarConfig(user?.role || 'SITE_SUPERVISOR');

  const filteredNavSections = navSections.map(section => ({
    ...section,
    items: section.items.filter(item => checkAccess(item.permission))
  })).filter(section => section.items.length > 0);

  return (
    <aside className="sidebar" id="desktop-sidebar">
      {/* Brand */}
      <div className="sidebar-brand" style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-4) 0' }}>
        <Logo size="lg" />
      </div>

      {/* Company Badge */}
      {companyName && (
        <div className="sidebar-company-badge">
          <Building2 size={14} />
          <span className="sidebar-company-name">{companyName}</span>
        </div>
      )}

      {/* Navigation */}
      <nav className="sidebar-nav">
        {filteredNavSections.map((section) => {
          const isCollapsed = collapsedSections[section.label] || false;
          return (
            <div key={section.label} className="sidebar-section">
              <div 
                className="sidebar-section-label"
                onClick={() => toggleSection(section.label)}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <span>{section.label}</span>
                <ChevronDown 
                  size={12} 
                  style={{ 
                    transition: 'transform 0.2s ease',
                    transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                    opacity: 0.5
                  }} 
                />
              </div>
              <div 
                className="sidebar-section-items"
                style={{
                  maxHeight: isCollapsed ? '0px' : '800px',
                  overflow: 'hidden',
                  transition: 'max-height 0.3s ease'
                }}
              >
                {section.items.map(({ to, icon: Icon, label, badge }) => (
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
                    {badge && unreadCount > 0 && (
                      <span className="sidebar-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User */}
      <div className="sidebar-footer">
        <div 
          className="sidebar-switch-company" 
          onClick={() => {
            // Clear company_id to trigger company selection
            const userData = user ? { ...user, company_id: null } : null;
            if (userData) {
              localStorage.setItem('user', JSON.stringify(userData));
              navigate('/select-company');
              window.location.reload();
            }
          }}
          title="Switch Company"
        >
          <ArrowLeftRight size={14} />
          <span>Switch Company</span>
        </div>
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
