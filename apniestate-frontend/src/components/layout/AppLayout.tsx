import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import Sidebar from './Sidebar';
import { TopBar, BottomNav, FAB } from '@/components/design-system';

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const isDesktop = useIsDesktop();

  if (isLoading) {
    return (
      <div className="loading-page" style={{ minHeight: '100vh' }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
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
    </div>
  );
}
