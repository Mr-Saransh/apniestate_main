import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard, ClipboardList, Users, HardHat, FileText,
  Package, Warehouse, ShoppingCart, Flag, CalendarDays,
  BookOpen, TrendingUp, ShoppingBag, Receipt, CreditCard,
  Truck, DollarSign, BarChart2, FolderOpen, UserCog, Settings,
  Download, FileDown, Bell, Calendar, UserCircle, X, Building2, LogOut, FileCheck, Landmark, PieChart
} from "lucide-react";
import Logo from '@/components/shared/Logo';

type NavItem = { id: string; label: string; icon: React.ElementType; badge?: number };
type NavGroup = { label: string; items: NavItem[] };

const navGroups: NavGroup[] = [
  {
    label: "Main Menu", items: [
      { id: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "/projects", label: "Projects", icon: FolderOpen },
      { id: "/progress", label: "Progress", icon: CalendarDays },
      { id: "/purchase", label: "Purchase", icon: ShoppingCart },
      { id: "/finance", label: "Finance", icon: Landmark },
      { id: "/operations", label: "Operations", icon: HardHat },
      { id: "/reports", label: "Reports", icon: BarChart2 },
      { id: "/settings", label: "Settings", icon: Settings },
    ]
  }
];

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const { user, logout } = useAuth();
  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'AR';
  const role = user?.role || 'ADMIN';

  // Role-based filtering logic
  const filteredGroups = navGroups.map(group => {
    let items = group.items;
    
    if (role === 'SITE_SUPERVISOR') {
      const allowed = ['/dashboard', '/progress', '/operations'];
      items = items.filter(item => allowed.includes(item.id));
    } else if (role === 'PROJECT_MANAGER') {
      const restricted = ['/settings'];
      items = items.filter(item => !restricted.includes(item.id));
    } else if (role === 'ACCOUNTANT') {
      const allowed = ['/dashboard', '/finance', '/purchase', '/operations', '/reports'];
      items = items.filter(item => allowed.includes(item.id));
    }
    
    return { ...group, items };
  }).filter(group => group.items.length > 0);

  return (
    <div className="flex flex-col h-full bg-[#2648E7] text-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <Logo size="md" variant="light" />
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 ml-2 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
        {filteredGroups.map(group => (
          <div key={group.label} className="mb-0.5">
            <p className="px-4 pt-3 pb-1 text-[9px] font-bold uppercase tracking-widest opacity-40 m-0">{group.label}</p>
            {group.items.map(item => (
              <div key={item.id} className="px-2">
                <NavLink
                  to={item.id}
                  onClick={() => onClose && onClose()}
                  className={({ isActive }) =>
                    `group flex items-center justify-between px-4 py-2.5 mx-2 my-0.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive ? "bg-white/10 text-white font-semibold shadow-inner" : "text-white/70 hover:bg-white/5 hover:text-white"
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-[18px] h-[18px] opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-transform duration-200" />
                    <span className="group-hover:translate-x-0.5 transition-transform duration-200">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="bg-[#FCC300] text-[#0D1117] text-[10px] font-bold px-1.5 py-0.5 rounded-md group-hover:scale-105 transition-transform duration-200">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="px-3 py-3 border-t border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-[#FCC300] flex items-center justify-center text-[#0D1117] text-[11px] font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold m-0">{user?.name || 'Asim Raza'}</p>
            <p className="text-[9px] opacity-50 m-0">{user?.role ? user.role.replace(/_/g, ' ') : 'Super Admin'}</p>
          </div>
          <button onClick={logout} className="p-1 rounded bg-transparent border-none outline-none">
            <LogOut className="w-3.5 h-3.5 opacity-40 flex-shrink-0 cursor-pointer hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </div>
    </div>
  );
}
