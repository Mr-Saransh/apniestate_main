import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import Sidebar from './Sidebar';
import { BottomNav } from './BottomNav';
import { TopBar, FAB } from '@/components/design-system';
import Logo from '@/components/shared/Logo';
import UniversalSearch from '@/components/shared/UniversalSearch';

export default function AppLayout() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const isDesktop = useIsDesktop();

  if (isLoading) {
    return (
      <div className="loading-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
        <Logo size="xl" className="animate-pulse" />
        <div className="spinner" style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-primary)' }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user && !user.onboarded) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="app-layout">
      {isDesktop ? <Sidebar /> : <BottomNav />}
      <TopBar />
      <main className="app-main">
        <div className="app-content">
          <Outlet />
        </div>
      </main>
      <FAB />
      <UniversalSearch />
    </div>
  );
}
