import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Bell, Menu, Building2 } from 'lucide-react';

import ProjectSwitcher from '@/components/shared/ProjectSwitcher';

interface MobileHeaderProps {
  onMenuClick?: () => void;
}

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Overview',
  '/projects': 'Projects',
  '/tasks': 'Tasks',
  '/attendance': 'Attendance',
  '/inventory': 'Inventory',
  '/materials': 'Materials',
  '/finance': 'Finance',
  '/documents': 'Documents',
  '/sites': 'Sites',
  '/vendors': 'Vendors',
  '/reports': 'Reports & Analytics',
  '/settings': 'Company Settings',
  '/notifications': 'Notifications',
  '/workers': 'Workers',
  '/contractors': 'Contractors',
  '/leaves': 'Leaves',
  '/invoices': 'Invoices',
  '/payments': 'Vendor Payments',
  '/budgets': 'Budgets',
  '/payroll': 'Payroll',
  '/dpr': 'Daily Progress Reports',
  '/approvals': 'Approvals',
  '/users': 'Users',
  '/calendar': 'Calendar',
  '/equipment': 'Equipment Usage',
  '/material-requests': 'Material Requests',
  '/timeline': 'Timeline',
  '/daily-logs': 'Daily Logs',
  '/export-attendance': 'Export Attendance',
  '/export-dpr': 'Export DPR',
};

export function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const getPageTitle = (path: string): string => {
    for (const [key, title] of Object.entries(PAGE_TITLES)) {
      if (path.startsWith(key)) return title;
    }
    return 'Apni Estate';
  };

  return (
    <>
      <header
      id="mobile-header"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        backgroundColor: '#2648E7',
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        height: '56px',
        flexShrink: 0,
      }}
    >
      {/* Left: Hamburger + Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={onMenuClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px',
            borderRadius: '8px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#FFFFFF',
            marginLeft: '-4px',
            transition: 'background 0.15s'
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            backgroundColor: '#FCC300',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Building2 size={12} color="#0D1117" />
          </div>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>
            Apni Estate
          </span>
        </div>
      </div>

      {/* Right: Notifications + Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() => navigate('/notifications')}
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px',
            borderRadius: '8px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#FFFFFF',
            transition: 'background 0.15s'
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          aria-label="Notifications"
        >
          <Bell size={20} />
          {/* Notification dot */}
          <span style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#FCC300',
            border: '1.5px solid #2648E7'
          }} />
        </button>

        <button
          onClick={() => navigate('/settings')}
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: '#FCC300',
            color: '#0D1117',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            flexShrink: 0
          }}
        >
          {user ? getInitials(user.name) : '?'}
        </button>
      </div>
    </header>

      {/* Secondary Context Bar for Mobile */}
      <div 
        style={{ 
          display: 'flex', 
          gap: '8px', 
          padding: '8px 16px', 
          backgroundColor: '#f8fafc', 
          borderBottom: '1px solid #e2e8f0',
          flexWrap: 'wrap',
          position: 'relative',
          zIndex: 40
        }}
      >

        <ProjectSwitcher />
      </div>
    </>
  );
}

export default MobileHeader;
