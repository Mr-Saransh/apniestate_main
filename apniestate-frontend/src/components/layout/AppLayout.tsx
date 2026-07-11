import { useState, useEffect } from 'react';
import { Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import Sidebar from './Sidebar';
import UniversalSearch from '@/components/shared/UniversalSearch';
import Logo from '@/components/shared/Logo';

import ProjectSwitcher from '@/components/shared/ProjectSwitcher';
import {
  Menu, Bell, Search, LayoutDashboard, Users,
  ShoppingCart, UserCircle, Building2, BookOpen, Package, ClipboardList
} from 'lucide-react';

const screenTitles: Record<string, string> = {
  "/": "Overview", "/daily-logs": "Daily Logs", "/attendance": "Attendance",
  "/workers": "Workers", "/dpr": "Daily Progress Report", "/materials": "Materials Master",
  "/inventory": "Inventory", "/material-requests": "Material Requests", "/milestones": "Milestones",
  "/timeline": "Timeline", "/cashbook": "Cashbook", "/budgets": "Budgets",
  "/purchase-orders": "Purchase Orders", "/expenses": "Expenses", "/invoices": "Invoices",
  "/payments": "Vendor Payments", "/equipment": "Equipment Usage", "/payroll": "Payroll",
  "/reports": "Reports & Analytics", "/documents": "Documents", "/users": "Users",
  "/settings": "Company Settings", "/export-attendance": "Export Attendance",
  "/export-dpr": "Export DPR", "/profile": "My Profile", "/notifications": "Notifications", "/calendar": "Calendar",
};

// We will construct bottomNav dynamically inside the component now

export default function AppLayout() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const isSupervisor = user?.role === 'SITE_SUPERVISOR';
  
  const bottomNav = [
    { id: "/dashboard", icon: LayoutDashboard, label: "Home" },
    { id: "/material-requests", icon: ShoppingCart, label: "Purchase" },
    { id: "/finance", icon: BookOpen, label: "Finance" },
    isSupervisor 
      ? { id: "/dpr", icon: ClipboardList, label: "Progress" }
      : { id: "/timeline", icon: ClipboardList, label: "Progress" },
    { id: "/profile", icon: UserCircle, label: "Profile" },
  ];

  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'AR';
  const activeTitle = screenTitles[location.pathname] || "Apni Estate";

  return (
    <div className="flex min-h-screen bg-background font-sans overflow-x-hidden">
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-col fixed inset-y-0 left-0 z-40 shadow-xl transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full'}`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <aside className="relative flex flex-col w-72 h-full shadow-2xl transition-transform duration-300">
            <Sidebar onClose={() => setDrawerOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-h-screen min-w-0 transition-all duration-300 ease-in-out ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}`}>
        
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-30 bg-[#2648E7] text-white flex items-center justify-between px-4 h-14 flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setDrawerOpen(true)} className="p-1.5 rounded-lg hover:bg-white/10 -ml-1 transition-colors">
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Logo size="sm" variant="light" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/notifications')} className="relative p-1.5 rounded-lg hover:bg-white/10 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#FCC300] rounded-full border border-[#2648E7]" />
            </button>
            <button onClick={() => navigate('/profile')} className="w-7 h-7 rounded-full bg-[#FCC300] flex items-center justify-center text-[#0D1117] text-[10px] font-bold hover:opacity-80 transition-opacity">
              {initials}
            </button>
          </div>
        </header>

        {/* Secondary Context Bar for Mobile (Project Switcher) */}
        <div className="lg:hidden sticky top-14 z-20 bg-muted/30 backdrop-blur-md border-b border-border px-4 py-2 flex items-center shadow-sm">
          <ProjectSwitcher />
        </div>

        {/* Desktop Header */}
        <header className="hidden lg:flex sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-border items-center justify-between px-6 h-16 flex-shrink-0">
          <div className="flex items-center gap-3">
             <button 
               onClick={() => setSidebarOpen(!sidebarOpen)} 
               className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground mr-2"
               aria-label="Toggle Sidebar"
             >
               <Menu className="w-5 h-5" />
             </button>
             <h1 className="text-sm font-bold text-foreground">{activeTitle}</h1>
          </div>
          
          <div className="flex items-center gap-3">

            <ProjectSwitcher />
            <div className="h-6 w-px bg-border mx-2"></div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                className="w-full bg-muted/50 border border-transparent hover:border-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all" 
                placeholder="Search anything (Cmd+K)..." 
              />
            </div>
            <button onClick={() => navigate('/notifications')} className="relative p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
            </button>
            <button onClick={() => navigate('/profile')} className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-[11px] font-bold shadow-sm hover:opacity-80 transition-opacity">
              {initials}
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-4 pt-2 pb-24 lg:p-6 lg:pb-8">
          <div className="max-w-[1400px] mx-auto">
            <Outlet />
          </div>
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border z-30 flex items-stretch h-[60px] pb-safe shadow-[0_-4px_16px_rgba(0,0,0,0.05)]">
          {bottomNav.map(item => {
            const isActive = location.pathname === item.id;
            return (
              <a
                key={item.id}
                href={item.id}
                className="flex-1 flex flex-col items-center justify-center gap-1 relative no-underline hover:bg-muted/30 transition-colors"
                onClick={(e) => {
                  if(location.pathname === item.id) e.preventDefault();
                }}
              >
                {isActive && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-b-full shadow-[0_2px_4px_rgba(38,72,231,0.5)]" />}
                <div className="relative mt-1">
                  <item.icon className={`w-5 h-5 transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[9px] font-semibold transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}>{item.label}</span>
              </a>
            );
          })}
        </nav>
      </div>

      <UniversalSearch />
    </div>
  );
}
