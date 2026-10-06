import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getUserCrmRole } from '@/config/crm-permissions';

export type AppMode = 'ERP' | 'CRM';

interface AppModeContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  toggleMode: () => void;
  isCrmOnly: boolean;
}

const AppModeContext = createContext<AppModeContextType | undefined>(undefined);

export function AppModeProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const crmRole = getUserCrmRole(user);
  const companyRoles = user?.company_roles || [];
  const hasErpRole =
    companyRoles.some((r: string) =>
      ['BUILDER', 'ADMIN', 'PROJECT_MANAGER', 'SITE_SUPERVISOR', 'ACCOUNTANT', 'INVENTORY_MANAGER'].includes(r)
    ) ||
    ['BUILDER', 'ADMIN', 'PROJECT_MANAGER', 'SITE_SUPERVISOR', 'ACCOUNTANT', 'INVENTORY_MANAGER'].includes(
      user?.role || ''
    );
  const isCrmOnly = Boolean(
    (crmRole === 'TELECALLER' ||
      crmRole === 'CRM_MANAGER' ||
      user?.role === 'TELECALLER' ||
      user?.role === 'SALES_EXECUTIVE') &&
      !hasErpRole
  );

  const [mode, setModeState] = useState<AppMode>(() => {
    if (isCrmOnly) return 'CRM';
    const saved = localStorage.getItem('apniestate_app_mode');
    if (saved === 'CRM' || saved === 'ERP') return saved;
    if (window.location.pathname.startsWith('/crm')) return 'CRM';
    return 'ERP';
  });

  // Keep mode in sync with active route & enforce CRM role confinement
  useEffect(() => {
    if (isCrmOnly) {
      if (mode !== 'CRM') {
        setModeState('CRM');
        localStorage.setItem('apniestate_app_mode', 'CRM');
      }
      return;
    }

    if (location.pathname.startsWith('/crm') && mode !== 'CRM') {
      setModeState('CRM');
      localStorage.setItem('apniestate_app_mode', 'CRM');
    } else if (
      !location.pathname.startsWith('/crm') &&
      !['/login', '/signup', '/landing', '/profile', '/notifications', '/settings'].includes(location.pathname) &&
      mode !== 'ERP'
    ) {
      // If we are on ERP pages
      if (['/dashboard', '/projects', '/purchase', '/finance', '/operations', '/progress', '/more'].some(p => location.pathname.startsWith(p))) {
        setModeState('ERP');
        localStorage.setItem('apniestate_app_mode', 'ERP');
      }
    }
  }, [location.pathname, isCrmOnly, mode]);

  const setMode = (newMode: AppMode) => {
    if (isCrmOnly && newMode === 'ERP') {
      // Telecallers and CRM-only staff must never switch to ERP
      return;
    }

    setModeState(newMode);
    localStorage.setItem('apniestate_app_mode', newMode);
    if (newMode === 'CRM') {
      if (!location.pathname.startsWith('/crm')) {
        navigate('/crm');
      }
    } else {
      if (location.pathname.startsWith('/crm')) {
        navigate('/dashboard');
      }
    }
  };

  const toggleMode = () => {
    if (isCrmOnly) return;
    const next = mode === 'ERP' ? 'CRM' : 'ERP';
    setMode(next);
  };

  return (
    <AppModeContext.Provider value={{ mode, setMode, toggleMode, isCrmOnly }}>
      {children}
    </AppModeContext.Provider>
  );
}

export function useAppMode() {
  const context = useContext(AppModeContext);
  if (!context) {
    throw new Error('useAppMode must be used within an AppModeProvider');
  }
  return context;
}
