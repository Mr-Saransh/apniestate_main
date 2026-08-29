import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export type AppMode = 'ERP' | 'CRM';

interface AppModeContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  toggleMode: () => void;
}

const AppModeContext = createContext<AppModeContextType | undefined>(undefined);

export function AppModeProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [mode, setModeState] = useState<AppMode>(() => {
    const saved = localStorage.getItem('apniestate_app_mode');
    if (saved === 'CRM' || saved === 'ERP') return saved;
    if (window.location.pathname.startsWith('/crm')) return 'CRM';
    return 'ERP';
  });

  // Keep mode in sync with active route
  useEffect(() => {
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
  }, [location.pathname]);

  const setMode = (newMode: AppMode) => {
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
    const next = mode === 'ERP' ? 'CRM' : 'ERP';
    setMode(next);
  };

  return (
    <AppModeContext.Provider value={{ mode, setMode, toggleMode }}>
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
