import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  Bell,
  User,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  FolderKanban,
  MapPin,
  ClipboardList,
  UserCheck,
  Package,
  Boxes,
  Truck,
  Users,
  Layers,
  Calendar,
  Wallet,
  FileText,
  BarChart3,
  Settings,
  Building2,
  ArrowLeft,
  Search,
  Shield,
  Calculator,
  Briefcase,
  Check,
  Menu
} from 'lucide-react';
import { Colors } from './Colors';
import { Shadows } from './Shadows';

interface TopBarProps {
  title?: string;
  icon?: React.ReactNode;
  leftAction?: React.ReactNode;
}

export function TopBar({ title: customTitle, icon: customIcon, leftAction }: TopBarProps) {
  const { user, memberships, logout, switchWorkspace } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [assignedRoles, setAssignedRoles] = useState<string[]>([]);

  useEffect(() => {
    // Fetch user's workspaces to get roles for current company
    if (user?.company_id) {
      import('@/api/client').then(({ apiClient }) => {
        apiClient.get<{ memberships: any[] }>('/auth/workspaces')
          .then(res => {
            if (res.success && res.data) {
              const currentMembership = res.data.memberships.find((m: any) => m.company_id === user.company_id);
              if (currentMembership) {
                setAssignedRoles(currentMembership.roles);
              }
            }
          })
          .catch(() => {});
      });
    }
  }, [user?.company_id]);

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

  const getPageInfo = (path: string): { title: string; icon: React.ReactNode } => {
    const defaultIcon = <Building2 size={20} />;
    
    if (path.startsWith('/dashboard') || path === '/') {
      return { title: 'Dashboard', icon: <LayoutDashboard size={20} /> };
    }
    if (path.startsWith('/projects')) {
      return { title: 'Projects', icon: <FolderKanban size={20} /> };
    }
    if (path.startsWith('/sites')) {
      return { title: 'Sites', icon: <MapPin size={20} /> };
    }
    if (path.startsWith('/tasks') || path.startsWith('/work')) {
      return { title: 'Tasks', icon: <ClipboardList size={20} /> };
    }
    if (path.startsWith('/attendance')) {
      return { title: 'Attendance', icon: <UserCheck size={20} /> };
    }
    if (path.startsWith('/inventory')) {
      return { title: 'Inventory', icon: <Package size={20} /> };
    }
    if (path.startsWith('/materials')) {
      return { title: 'Materials', icon: <Boxes size={20} /> };
    }
    if (path.startsWith('/vendors')) {
      return { title: 'Vendors', icon: <Truck size={20} /> };
    }
    if (path.startsWith('/workers')) {
      return { title: 'Workers', icon: <Users size={20} /> };
    }
    if (path.startsWith('/contractors')) {
      return { title: 'Contractors', icon: <Layers size={20} /> };
    }
    if (path.startsWith('/leaves')) {
      return { title: 'Leaves', icon: <Calendar size={20} /> };
    }
    if (path.startsWith('/finance')) {
      return { title: 'Finance', icon: <Wallet size={20} /> };
    }
    if (path.startsWith('/invoices')) {
      return { title: 'Invoices', icon: <FileText size={20} /> };
    }
    if (path.startsWith('/payments')) {
      return { title: 'Payments', icon: <Wallet size={20} /> };
    }
    if (path.startsWith('/budgets')) {
      return { title: 'Budgets', icon: <BarChart3 size={20} /> };
    }
    if (path.startsWith('/documents')) {
      return { title: 'Documents', icon: <FileText size={20} /> };
    }
    if (path.startsWith('/reports')) {
      return { title: 'Reports', icon: <BarChart3 size={20} /> };
    }
    if (path.startsWith('/settings')) {
      return { title: 'Settings', icon: <Settings size={20} /> };
    }
    if (path.startsWith('/notifications')) {
      return { title: 'Notifications', icon: <Bell size={20} /> };
    }
    return { title: 'Apni Estate', icon: defaultIcon };
  };

  const pageInfo = getPageInfo(location.pathname);
  const title = customTitle || pageInfo.title;
  const icon = customIcon || pageInfo.icon;

  const allRolesConfig = [
    { id: 'BUILDER', label: 'Builder / Owner', icon: Building2 },
    { id: 'PROJECT_MANAGER', label: 'Project Manager', icon: Briefcase },
    { id: 'SITE_SUPERVISOR', label: 'Site Supervisor', icon: UserCheck },
    { id: 'ACCOUNTANT', label: 'Accountant', icon: Calculator },
  ];

  const roles = allRolesConfig.filter(r => assignedRoles.includes(r.id) || user?.role === r.id);

  return (
    <header
      className="unified-topbar"
      style={{
        height: '64px',
        backgroundColor: '#2648E7',
        borderBottom: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 900,
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.05)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {leftAction ? (
          leftAction
        ) : icon ? (
          <div
            style={{
              width: '36px',
              height: '36px',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              color: '#FFFFFF',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </div>
        ) : null}
        <h1
          style={{
            fontSize: '18px',
            fontWeight: 700,
            color: '#FFFFFF',
            margin: 0,
            letterSpacing: '-0.02em',
          }}
        >
          {title || 'Apni Estate'}
        </h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Notifications Icon */}
        <button
          type="button"
          aria-label="Notifications"
          onClick={() => navigate('/notifications')}
          style={{
            background: 'none',
            border: 'none',
            color: '#FFFFFF',
            cursor: 'pointer',
            padding: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
          className="tap-highlight"
        >
          <Bell size={22} />
          <span
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              width: '8px',
              height: '8px',
              backgroundColor: '#FFC300',
              borderRadius: '50%',
              border: '1.5px solid #1D4ED8',
            }}
          />
        </button>

        {/* Gold Initials Avatar Circle */}
        <div
          ref={dropdownRef}
          onClick={() => setShowDropdown(!showDropdown)}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: '#FFC300',
            color: '#1E3A8A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '12px',
            cursor: 'pointer',
            boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
          }}
        >
          {user ? getInitials(user.name) : 'AR'}
        </div>

        {showDropdown && (
          <div
            className="topbar-dropdown"
            style={{
              position: 'absolute',
              top: '100%',
              right: '16px',
              marginTop: '8px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              boxShadow: Shadows.lg,
              minWidth: '240px',
              zIndex: 1000,
              padding: '6px',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 700, color: Colors.mutedText, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
              Switch Workspace
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '180px', overflowY: 'auto' }}>
              {memberships.map((m) => {
                const isCurrent = user?.company_id === m.company_id;
                return (
                  <button
                    key={m.company_id}
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (!isCurrent) {
                        await switchWorkspace(m.company_id, m.roles[0]);
                        navigate('/dashboard');
                      }
                      setShowDropdown(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '10px 12px',
                      fontSize: '13px',
                      fontWeight: isCurrent ? 600 : 500,
                      color: isCurrent ? '#1D4ED8' : Colors.primaryText,
                      background: isCurrent ? 'rgba(29, 78, 216, 0.04)' : 'transparent',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Building2 size={14} color={isCurrent ? '#1D4ED8' : Colors.secondaryText} />
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <span>{m.company.name}</span>
                        <span style={{ fontSize: '10px', color: Colors.mutedText }}>Role: {m.roles[0].replace('_', ' ')}</span>
                      </div>
                    </div>
                    {isCurrent && <Check size={14} color="#1D4ED8" />}
                  </button>
                );
              })}
            </div>
            <div style={{ height: '1px', backgroundColor: '#E2E8F0' }} />
            
            <button
              type="button"
              onClick={() => { navigate('/settings'); setShowDropdown(false); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                color: Colors.primaryText,
                fontSize: '13px',
                border: 'none',
                backgroundColor: 'transparent',
                width: '100%',
                textAlign: 'left',
                cursor: 'pointer',
                fontWeight: 500,
                borderRadius: '8px'
              }}
            >
              <User size={16} />
              <span>Profile Settings</span>
            </button>
            <div style={{ height: '1px', backgroundColor: '#E2E8F0' }} />
            <button
              type="button"
              onClick={logout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                color: Colors.errorRed,
                fontSize: '13px',
                border: 'none',
                backgroundColor: 'transparent',
                width: '100%',
                textAlign: 'left',
                cursor: 'pointer',
                fontWeight: 500,
                borderRadius: '8px'
              }}
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
