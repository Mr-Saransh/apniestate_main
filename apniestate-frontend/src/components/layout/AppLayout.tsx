import { useState, useEffect } from 'react';
import { Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useProject } from '@/context/ProjectContext';
import Sidebar from './Sidebar';
import TopBar from './Topbar';
import BottomNav from './BottomNav';
import { X } from 'lucide-react';

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const { activeProject, projects, loading: projectLoading } = useProject();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const allowedPaths = ['/projects', '/login', '/signup', '/landing', '/complete-profile', '/subscription', '/pending-approval', '/renew', '/profile', '/notifications'];
    const currentPath = location.pathname;

    // Admin panel paths are handled in App.tsx directly without AppLayout
    if (currentPath.startsWith('/apni-admin')) return;

    if (user) {
      // 1. Profile must be completed
      if (!user.profile_completed && currentPath !== '/complete-profile') {
        navigate('/complete-profile', { replace: true });
        return;
      }
      
      // 2. Must have some subscription interaction
      if (user.profile_completed) {
        if (user.subscription_status === 'NONE' && currentPath !== '/subscription') {
          navigate('/subscription', { replace: true });
          return;
        }

        if (user.subscription_status === 'PENDING_TRIAL' && currentPath !== '/pending-approval') {
          navigate('/pending-approval', { replace: true });
          return;
        }

        if ((user.subscription_status === 'EXPIRED' || user.subscription_status === 'TRIAL_EXPIRED') && currentPath !== '/renew') {
          navigate('/renew', { replace: true });
          return;
        }
      }

      // 3. Normal workspace redirect if everything is good
      if (!projectLoading && projects.length === 0 && !allowedPaths.includes(currentPath)) {
        if (user?.role === 'BUILDER') {
          navigate('/projects?create=true');
        } else {
          navigate('/projects');
        }
      }
    }
  }, [projectLoading, projects.length, location.pathname, user, navigate]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    if (location.pathname === '/') {
      return <Navigate to="/landing" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  const inProject = activeProject !== null && location.pathname !== '/projects';

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
      {/* TopBar */}
      {location.pathname === '/projects' ? (
        <TopBar onOpenSidebar={() => {}} /> 
      ) : (
        <TopBar onOpenSidebar={() => setSidebarOpen(true)} />
      )}

      {/* Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Desktop sidebar */}
        {inProject && (
          <aside className="hidden lg:flex flex-col w-64 shrink-0 h-full z-10 relative shadow-xl">
            <Sidebar />
          </aside>
        )}

        {/* Mobile overlay sidebar */}
        <div className={`lg:hidden absolute inset-0 z-50 flex ${sidebarOpen ? "" : "pointer-events-none"}`}>
          <div
            className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${sidebarOpen ? "opacity-100" : "opacity-0"}`}
            onClick={() => setSidebarOpen(false)}
          />
          <div
            className={`relative w-72 h-full bg-[#2648E7] transition-transform duration-250 shadow-2xl ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
            style={{ transitionTimingFunction: "cubic-bezier(0.4,0,0.2,1)" }}
          >
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative w-full bg-slate-50/50">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      {inProject && <BottomNav />}
    </div>
  );
}
