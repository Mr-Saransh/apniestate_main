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
  Check
} from 'lucide-react';
import { Colors } from './Colors';
import { Shadows } from './Shadows';

interface TopBarProps {
  title?: string;
  icon?: React.ReactNode;
  leftAction?: React.ReactNode;
}

export function TopBar({ title: customTitle, icon: customIcon, leftAction }: TopBarProps) {
  const { user, logout, switchWorkspace } = useAuth();
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
        backgroundColor: Colors.background,
        borderBottom: '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 900,
        boxShadow: Shadows.sm,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {leftAction ? (
          leftAction
        ) : (
          <div
            style={{
              width: '36px',
              height: '36px',
              backgroundColor: 'rgba(10, 61, 145, 0.08)',
              color: Colors.primaryBlue,
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </div>
        )}
        <h1
          style={{
            fontSize: '18px',
            fontWeight: 700,
            color: Colors.primaryText,
            margin: 0,
            letterSpacing: '-0.02em',
          }}
        >
          {title}
        </h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          type="button"
          aria-label="Search"
          onClick={() => window.dispatchEvent(new CustomEvent('open-search'))}
          style={{
            background: 'none',
            border: 'none',
            color: Colors.secondaryText,
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Search size={20} />
        </button>

        <button
          type="button"
          aria-label="Notifications"
          onClick={() => navigate('/notifications')}
          style={{
            background: 'none',
            border: 'none',
            color: Colors.secondaryText,
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <Bell size={20} />
          <span
            style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              width: '8px',
              height: '8px',
              backgroundColor: Colors.errorRed,
              borderRadius: '50%',
              border: `2px solid ${Colors.background}`,
            }}
          />
        </button>

        <div
          ref={dropdownRef}
          onClick={() => setShowDropdown(!showDropdown)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            position: 'relative',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: Colors.primaryBlue,
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '13px',
            }}
          >
            {user ? getInitials(user.name) : '?'}
          </div>
          <ChevronDown size={14} style={{ color: Colors.mutedText }} />

          {showDropdown && (
            <div
              className="topbar-dropdown"
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                boxShadow: Shadows.lg,
                minWidth: '220px',
                zIndex: 1000,
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '8px 16px', fontSize: '11px', fontWeight: 700, color: Colors.mutedText, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                Switch Role
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {roles.map((r) => {
                  const Icon = r.icon;
                  const isCurrent = user?.role === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (user?.company_id) {
                          await switchWorkspace(user.company_id, r.id);
                        }
                        setShowDropdown(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: '10px 16px',
                        fontSize: '13px',
                        fontWeight: isCurrent ? 600 : 500,
                        color: isCurrent ? Colors.primaryBlue : Colors.primaryText,
                        background: isCurrent ? 'rgba(10, 61, 145, 0.04)' : 'transparent',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Icon size={14} color={isCurrent ? Colors.primaryBlue : Colors.secondaryText} />
                        <span>{r.label.split(' / ')[0]}</span>
                      </div>
                      {isCurrent && <Check size={14} color={Colors.primaryBlue} />}
                    </button>
                  );
                })}
              </div>
              <div style={{ height: '1px', backgroundColor: '#E2E8F0' }} />
              
              <button
                type="button"
                onClick={() => navigate('/settings')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 16px',
                  color: Colors.primaryText,
                  fontSize: '13px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  width: '100%',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                <User size={16} />
                <span>Settings</span>
              </button>
              <div style={{ height: '1px', backgroundColor: '#E2E8F0' }} />
              <button
                type="button"
                onClick={logout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 16px',
                  color: Colors.errorRed,
                  fontSize: '13px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  width: '100%',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
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
