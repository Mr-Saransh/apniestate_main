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
  { label: "Overview", items: [{ id: "/dashboard", label: "Overview", icon: LayoutDashboard }] },
  {
    label: "Entities", items: [
      { id: "/projects", label: "Projects", icon: Building2 },
      { id: "/sites", label: "Sites", icon: HardHat },
      { id: "/milestones", label: "Milestones", icon: Flag },
      { id: "/vendors", label: "Vendors", icon: Truck },
      { id: "/contractors", label: "Contractors", icon: Users },
    ],
  },
  {
    label: "Field Operations", items: [
      { id: "/daily-logs", label: "Daily Logs", icon: ClipboardList },
      { id: "/attendance", label: "Attendance", icon: Users },
      { id: "/workers", label: "Workers", icon: HardHat },
      { id: "/dpr", label: "Daily Progress Report", icon: FileText },
    ],
  },
  {
    label: "Materials", items: [
      { id: "/materials", label: "Materials Master", icon: Package },
      { id: "/inventory", label: "Inventory", icon: Warehouse },
      { id: "/material-requests", label: "Material Requests", icon: ShoppingCart, badge: 8 },
    ],
  },
  {
    label: "Planning", items: [
      { id: "/milestones", label: "Milestones", icon: Flag },
      { id: "/timeline", label: "Timeline", icon: CalendarDays },
    ],
  },
  {
    label: "Finance", items: [
      { id: "/finance", label: "Finance Dashboard", icon: Landmark },
      { id: "/cashbook", label: "Cashbook", icon: BookOpen },
      { id: "/budgets", label: "Budgets", icon: PieChart },
      { id: "/purchase-orders", label: "Purchase Orders", icon: ShoppingCart },
      { id: "/expenses", label: "Expenses", icon: Receipt },
      { id: "/invoices", label: "Invoices", icon: FileText },
      { id: "/payments", label: "Vendor Payments", icon: CreditCard },
    ],
  },
  {
    label: "Operations", items: [
      { id: "/equipment", label: "Equipment Usage", icon: Truck },
      { id: "/payroll", label: "Payroll", icon: DollarSign },
    ],
  },
  {
    label: "Intelligence", items: [
      { id: "/reports", label: "Reports & Analytics", icon: BarChart2 },
      { id: "/documents", label: "Documents", icon: FolderOpen },
    ],
  },
  {
    label: "Admin", items: [
      { id: "/users", label: "Users", icon: UserCog },
      { id: "/profile", label: "Profile", icon: UserCircle },
      { id: "/settings", label: "Company Settings", icon: Settings },
    ],
  },
  {
    label: "Tools", items: [
      { id: "/export-attendance", label: "Export Attendance", icon: Download },
      { id: "/export-dpr", label: "Export DPR", icon: FileDown },
      { id: "/notifications", label: "Notifications", icon: Bell, badge: 5 },
      { id: "/calendar", label: "Calendar", icon: Calendar },
    ],
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
      // Allow only specific items for Site Supervisor
      const allowed = ['/dashboard', '/daily-logs', '/attendance', '/workers', '/dpr', '/material-requests', '/notifications', '/profile', '/export-attendance'];
      items = items.filter(item => allowed.includes(item.id));
    } else if (role === 'PROJECT_MANAGER') {
      // Project Manager shouldn't see full Admin or Cashbook
      const restricted = ['/users', '/settings', '/cashbook', '/invoices', '/payroll'];
      items = items.filter(item => !restricted.includes(item.id));
    } else if (role === 'ACCOUNTANT') {
      // Accountant focuses on Finance
      const allowed = ['/dashboard', '/finance', '/cashbook', '/budgets', '/purchase-orders', '/expenses', '/invoices', '/payments', '/payroll', '/vendors', '/contractors', '/reports', '/profile'];
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
