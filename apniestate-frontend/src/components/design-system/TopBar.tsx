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
  ArrowLeft
} from 'lucide-react';
import { Colors } from './Colors';
import { Shadows } from './Shadows';

interface TopBarProps {
  title?: string;
  icon?: React.ReactNode;
  leftAction?: React.ReactNode;
}

export function TopBar({ title: customTitle, icon: customIcon, leftAction }: TopBarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
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
                minWidth: '160px',
                zIndex: 1000,
                overflow: 'hidden',
              }}
            >
              <button
                type="button"
                onClick={() => navigate('/settings')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 16px',
                  color: Colors.primaryText,
                  fontSize: '14px',
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
                  fontSize: '14px',
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
