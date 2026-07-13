import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useProject } from '@/context/ProjectContext';
import Logo from '@/components/shared/Logo';
import {
  LayoutDashboard, Building2, ShoppingCart, Wallet, Users,
  BarChart2, FileSpreadsheet, Package, ClipboardList, Archive,
  Truck, BookOpen, FolderOpen, FileBarChart, Bell, Settings, X,
  LogOut
} from "lucide-react";

type NavItem = { id: string; label: string; icon: React.ElementType; badge?: number; hideOnMobile?: boolean };
type NavGroup = { label: string; items: NavItem[]; hideOnMobile?: boolean };

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const { user, logout } = useAuth();
  const { activeProject } = useProject();
  const location = useLocation();
  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'AR';
  const role = user?.role || 'ADMIN';

  const navGroups: NavGroup[] = [
    {
      label: "", items: [
        { id: "/dashboard", label: "Dashboard", icon: LayoutDashboard, hideOnMobile: true },
        { id: "/projects", label: "Projects", icon: Building2 },
      ]
    },
    {
      label: "Daily Work", hideOnMobile: true, items: [
        { id: "/purchase", label: "Purchase", icon: ShoppingCart },
        { id: "/finance", label: "Finance", icon: Wallet },
        { id: "/operations", label: "Operations", icon: Users },
        { id: "/progress", label: "Progress", icon: BarChart2 },
      ]
    },
    {
      label: "Purchase Detail", items: [
        { id: "/boq", label: "BOQ", icon: FileSpreadsheet },
        { id: "/material-requests", label: "Material Requests", icon: Package },
        { id: "/purchase-orders", label: "Purchase Orders", icon: ClipboardList },
        { id: "/inventory", label: "Inventory", icon: Archive },
        { id: "/vendors", label: "Vendors", icon: Truck },
      ]
    },
    {
      label: "More", items: [
        { id: "/dpr", label: "DPR", icon: BookOpen },
        { id: "/documents", label: "Documents", icon: FolderOpen },
        { id: "/reports", label: "Reports", icon: FileBarChart },
        { id: "/milestone-report", label: "Milestone Prog. Report", icon: FileBarChart },
        { id: "/notifications", label: "Notifications", icon: Bell, badge: 3 },
      ]
    }
  ];

  const filteredGroups = navGroups.map(group => {
    let items = group.items;
    if (role === 'SITE_SUPERVISOR') {
      const allowed = ['/dashboard', '/progress', '/operations', '/dpr'];
      items = items.filter(item => allowed.includes(item.id));
    } else if (role === 'ACCOUNTANT') {
      const allowed = ['/dashboard', '/finance', '/purchase', '/operations', '/reports', '/boq', '/purchase-orders', '/inventory', '/vendors'];
      items = items.filter(item => allowed.includes(item.id));
    }
    return { ...group, items };
  }).filter(group => group.items.length > 0);

  return (
    <div className="flex flex-col h-full bg-[#2648E7] text-white border-r border-[#2648E7] overflow-hidden">
      {/* Logo / Brand */}
      <div className="px-4 py-5 border-b border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <Logo size="md" variant="light" />
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 ml-2 shrink-0">
            <X className="w-4 h-4 text-white" />
          </button>
        )}
      </div>

      {activeProject && (
        <div className="px-4 py-2 border-b border-white/10 bg-black/10 shrink-0">
           <p className="text-[10px] text-white/70 uppercase tracking-wider font-bold">Active Project</p>
           <p className="text-sm font-bold text-white truncate leading-tight mt-0.5">{activeProject.name}</p>
        </div>
      )}

      {/* Nav items */}
      <div className="flex-1 overflow-y-auto py-3 space-y-0.5 custom-scrollbar">
        {filteredGroups.map((group, idx) => (
          <React.Fragment key={idx}>
            {group.label && (
              <div className={`pt-3 pb-1 px-4 ${group.hideOnMobile ? 'hidden lg:block' : ''}`}>
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">{group.label}</p>
              </div>
            )}
            {group.items.map(item => {
              const pathWithSearch = location.pathname + location.search;
              let targetPath = item.id;
              if (['/boq', '/material-requests', '/purchase-orders', '/inventory', '/vendors', '/materials'].includes(item.id)) {
                targetPath = `/purchase?tab=${item.id.replace('/', '')}`;
                if (item.id === '/material-requests') targetPath = '/purchase?tab=requests';
                if (item.id === '/purchase-orders') targetPath = '/purchase?tab=orders';
              }
              if (['/cashbook', '/expenses', '/invoices', '/payments', '/budgets'].includes(item.id)) {
                targetPath = `/finance?tab=${item.id.replace('/', '')}`;
              }
              if (['/timeline', '/milestones', '/dpr', '/calendar'].includes(item.id)) {
                targetPath = `/progress?tab=${item.id.replace('/', '')}`;
              }
              if (['/attendance', '/equipment', '/sites', '/contractors', '/workers'].includes(item.id)) {
                targetPath = `/operations?tab=${item.id.replace('/', '')}`;
              }
              
              const isActive = pathWithSearch === targetPath || (item.id === '/dashboard' && location.pathname === '/');
              return (
                <div key={item.id} className={`px-2 ${item.hideOnMobile || group.hideOnMobile ? 'hidden lg:block' : ''}`}>
                  <NavLink
                    to={item.id}
                    onClick={() => onClose && onClose()}
                    className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive 
                        ? "bg-white/10 text-[#FCC300] font-bold shadow-inner" 
                        : "text-white/70 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={16} className={`transition-transform duration-200 ${isActive ? "text-[#FCC300] opacity-100 scale-110" : "opacity-80 group-hover:opacity-100 group-hover:scale-110"}`} />
                      <span className="group-hover:translate-x-0.5 transition-transform duration-200">{item.label}</span>
                    </div>
                    {item.badge ? (
                      <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center group-hover:scale-105 transition-transform duration-200">
                        {item.badge}
                      </span>
                    ) : null}
                  </NavLink>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {/* Bottom: profile */}
      <div className="px-4 py-4 border-t border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-full bg-[#FCC300] flex items-center justify-center text-[#0D1117] font-bold text-sm shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate leading-tight">{user?.name || 'Asim Raza'}</p>
            <p className="text-[10px] text-white/60 truncate leading-tight">{user?.role ? user.role.replace(/_/g, ' ') : 'Super Admin'}</p>
          </div>
          <button onClick={logout} className="text-white/50 hover:text-white transition-colors p-1">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
