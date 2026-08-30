import { Home, ShoppingCart, Wallet, Users, BarChart2, LayoutDashboard, GitCommit, Clock, IndianRupee, Calendar } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useAppMode } from '@/context/AppModeContext';

const ERP_BOTTOM_NAV = [
  { id: "dashboard", path: "/dashboard", Icon: Home, label: "Home" },
  { id: "purchase", path: "/purchase", Icon: ShoppingCart, label: "Purchase" },
  { id: "finance", path: "/finance", Icon: Wallet, label: "Finance" },
  { id: "operations", path: "/operations", Icon: Users, label: "Labour" },
  { id: "progress", path: "/progress", Icon: BarChart2, label: "Progress" },
];

const TELECALLER_BOTTOM_NAV = [
  { id: "overview", path: "/crm?tab=overview", Icon: LayoutDashboard, label: "Overview" },
  { id: "leads", path: "/crm?tab=leads", Icon: Users, label: "My Leads" },
  { id: "followups", path: "/crm?tab=followups", Icon: Clock, label: "Follow-ups" },
  { id: "activities", path: "/crm?tab=activities", Icon: Calendar, label: "Visits" },
  { id: "deals", path: "/crm?tab=deals", Icon: IndianRupee, label: "Bookings" },
];

const CRM_BOTTOM_NAV = [
  { id: "overview", path: "/crm?tab=overview", Icon: LayoutDashboard, label: "Overview" },
  { id: "leads", path: "/crm?tab=leads", Icon: Users, label: "Leads" },
  { id: "pipeline", path: "/crm?tab=pipeline", Icon: GitCommit, label: "Pipeline" },
  { id: "team", path: "/crm?tab=team", Icon: Users, label: "Team" },
  { id: "deals", path: "/crm?tab=deals", Icon: IndianRupee, label: "Bookings" },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { mode } = useAppMode();
  const role = user?.role || 'BUILDER';
  const crmRole = user?.crm_role || (user?.role === 'CRM_MANAGER' ? 'CRM_MANAGER' : (user?.role === 'TELECALLER' || user?.role === 'SALES_EXECUTIVE') ? 'TELECALLER' : 'BUILDER');

  let navItems = mode === 'CRM'
    ? (crmRole === 'TELECALLER' ? [...TELECALLER_BOTTOM_NAV] : [...CRM_BOTTOM_NAV])
    : [...ERP_BOTTOM_NAV];

  if (mode === 'ERP') {
    if (role === 'ACCOUNTANT') {
      const allowed = ['dashboard', 'finance', 'purchase', 'operations'];
      navItems = navItems.filter(item => allowed.includes(item.id));
    } else if (role === 'PROJECT_MANAGER') {
      const allowed = ['dashboard', 'progress', 'purchase', 'finance', 'operations'];
      navItems = navItems.filter(item => allowed.includes(item.id));
    }
  }

  return (
    <nav className="lg:hidden shrink-0 flex items-center bg-white border-t border-border pb-safe shadow-lg z-30">
      {navItems.map(({ id, path, Icon, label }) => {
        let isActive = false;
        if (mode === 'CRM') {
          if (path === '/crm?tab=overview') {
            isActive = location.pathname === '/crm' && (location.search === '' || location.search.includes('tab=overview'));
          } else {
            isActive = (location.pathname + location.search) === path;
          }
        } else {
          isActive = location.pathname.startsWith(path) || (id === "dashboard" && location.pathname === "/");
        }

        return (
          <button
            key={id}
            onClick={() => navigate(path)}
            className="flex-1 flex flex-col items-center gap-0.5 py-2.5 active:scale-90 transition-transform"
          >
            <div className={`size-8 rounded-xl flex items-center justify-center ${isActive ? "bg-[#2648E7]/10" : ""}`}>
              <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} color={isActive ? "#2648E7" : "#9ca3af"} />
            </div>
            <span className="text-[10px] font-bold" style={{ color: isActive ? "#2648E7" : "#9ca3af" }}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
