import { useState, useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import Sidebar from './Sidebar';
import UniversalSearch from '@/components/shared/UniversalSearch';
import Logo from '@/components/shared/Logo';
import {
  Menu, Bell, Search, LayoutDashboard, Users,
  ShoppingCart, UserCircle, Building2, BookOpen, Package
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
  const { isAuthenticated, isLoading, user, activeWorkspace } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!activeWorkspace && user) return <Navigate to="/select-workspace" replace />;

  const isSupervisor = user?.role === 'SITE_SUPERVISOR';
  
  const bottomNav = [
    { id: "/dashboard", icon: LayoutDashboard, label: "Home" },
    isSupervisor 
      ? { id: "/attendance", icon: Users, label: "Attendance" }
      : { id: "/finance", icon: BookOpen, label: "Finance" },
    { id: "/materials", icon: Package, label: "Materials" },
    { id: "/notifications", icon: Bell, label: "Alerts", badge: 5 },
    { id: "/profile", icon: UserCircle, label: "Profile" },
  ];

  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'AR';
  const activeTitle = screenTitles[location.pathname] || "Apni Estate";

  return (
    <div className="flex min-h-screen bg-background font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-64 z-40 shadow-xl">
        <Sidebar onClose={() => setDrawerOpen(false)} />
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
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
        
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
            <button className="relative p-1.5 rounded-lg hover:bg-white/10 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#FCC300] rounded-full border border-[#2648E7]" />
            </button>
            <div className="w-7 h-7 rounded-full bg-[#FCC300] flex items-center justify-center text-[#0D1117] text-[10px] font-bold">
              {initials}
            </div>
          </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden lg:flex sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-border items-center justify-between px-6 h-14 flex-shrink-0">
          <h1 className="text-sm font-bold text-foreground">{activeTitle}</h1>
          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                className="w-full bg-muted/50 border border-transparent hover:border-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all" 
                placeholder="Search anything (Cmd+K)..." 
              />
            </div>
            <button className="relative p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
            </button>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-[11px] font-bold shadow-sm">
              {initials}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-24 lg:pb-8">
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
                  {item.badge && (
                    <span className="absolute -top-1.5 -right-2.5 bg-red-500 text-white text-[8px] font-bold rounded-full min-w-[14px] h-[14px] px-0.5 flex items-center justify-center leading-none border border-white shadow-sm">
                      {item.badge}
                    </span>
                  )}
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
