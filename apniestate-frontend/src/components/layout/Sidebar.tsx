import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useProject } from '@/context/ProjectContext';
import { useAppMode } from '@/context/AppModeContext';
import { getUserCrmRole } from '@/config/crm-permissions';
import Logo from '@/components/shared/Logo';
import {
  LayoutDashboard, Building2, ShoppingCart, Wallet, Users,
  BarChart2, FileSpreadsheet, Package, ClipboardList, Archive,
  Truck, BookOpen, FolderOpen, FileBarChart, Bell, Settings, X,
  LogOut, UserCheck, GitCommit, Clock, IndianRupee, Calendar,
  Sparkles, Layers, Lock, Shield
} from "lucide-react";
import { useTranslation } from 'react-i18next';
import { subscriptionApi, CompanyEntitlements } from '@/api/subscription';

type NavItem = { id: string; label: string; icon: React.ElementType; badge?: number; hideOnMobile?: boolean };
type NavGroup = { label: string; items: NavItem[]; hideOnMobile?: boolean };

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { activeProject } = useProject();
  const { mode, setMode } = useAppMode();
  const location = useLocation();
  const navigate = useNavigate();
  const [entitlements, setEntitlements] = React.useState<CompanyEntitlements | null>(null);

  React.useEffect(() => {
    subscriptionApi.getEntitlements()
      .then(res => {
        if (res.success && res.data) {
          setEntitlements(res.data);
        }
      })
      .catch(() => {});
  }, []);

  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'AS';
  const role = user?.role || 'BUILDER';
  const crmRole = getUserCrmRole(user);
  const companyRoles = user?.company_roles || [role];
  const isBuilder = role === 'BUILDER' || role === 'ADMIN' || crmRole === 'BUILDER';
  const hasErp = companyRoles.some(r => ['BUILDER', 'ADMIN', 'SITE_SUPERVISOR', 'ACCOUNTANT', 'INVENTORY_MANAGER', 'PROJECT_MANAGER', 'WORKER'].includes(r));
  const hasCrm = Boolean(crmRole) || companyRoles.some(r => ['CRM_MANAGER', 'TELECALLER', 'SALES_EXECUTIVE'].includes(r));
  const canSwitchMode = isBuilder || user?.can_switch_mode || (hasErp && hasCrm);

  // ─── ERP Navigation Groups ─────────────────────────────────
  const erpNavGroups: NavGroup[] = [
    {
      label: "", items: [
        { id: "/dashboard", label: t('sidebar.dashboard', 'Dashboard'), icon: LayoutDashboard, hideOnMobile: true },
        { id: "/projects", label: t('sidebar.projects', 'Projects'), icon: Building2 },
      ]
    },
    {
      label: "Daily Work", hideOnMobile: true, items: [
        { id: "/purchase", label: t('sidebar.procurement', 'Purchase'), icon: ShoppingCart },
        { id: "/finance", label: t('sidebar.finance', 'Finance'), icon: Wallet },
        { id: "/operations", label: t('sidebar.operations', 'Operations'), icon: Users },
        { id: "/progress", label: t('sidebar.progress', 'Progress'), icon: BarChart2 },
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
        { id: "/users", label: "Users", icon: Users },
        { id: "/reports", label: "Reports", icon: FileBarChart },
        { id: "/milestone-report", label: "Milestone Prog. Report", icon: FileBarChart },
      ]
    },
    {
      label: "Account", items: [
        { id: "/notifications", label: "Notifications", icon: Bell, badge: 3 },
        { id: "/settings", label: "Settings", icon: Settings },
      ]
    }
  ];

  // ─── CRM Navigation Groups by Role ─────────────────────────
  const telecallerCrmNavGroups: NavGroup[] = [
    {
      label: "My Sales Workspace", items: [
        { id: "/crm?tab=overview", label: "Overview", icon: LayoutDashboard },
        { id: "/crm?tab=leads", label: "My Leads", icon: Users },
        { id: "/crm?tab=followups", label: "Follow-ups", icon: Clock },
        { id: "/crm?tab=activities", label: "Site Visits", icon: Calendar },
        { id: "/crm?tab=deals", label: "Bookings", icon: IndianRupee },
      ]
    },
    {
      label: "Account", items: [
        { id: "/profile", label: "Profile", icon: UserCheck },
        { id: "/notifications", label: "Notifications", icon: Bell, badge: 3 },
      ]
    }
  ];

  const managerCrmNavGroups: NavGroup[] = [
    {
      label: "Sales Core", items: [
        { id: "/crm?tab=overview", label: "Overview", icon: LayoutDashboard },
        { id: "/crm?tab=leads", label: "Leads", icon: Users },
        { id: "/crm?tab=customers", label: "Customers", icon: IndianRupee },
        { id: "/crm?tab=pipeline", label: "Sales Pipeline", icon: GitCommit },
        { id: "/crm?tab=followups", label: "Follow-ups", icon: Clock },
      ]
    },
    {
      label: "Team & Performance", items: [
        { id: "/crm?tab=team", label: "CRM Team", icon: Users },
        { id: "/crm?tab=deals", label: "Bookings", icon: IndianRupee },
        { id: "/crm?tab=reports", label: "Reports", icon: FileBarChart },
      ]
    },
    {
      label: "Account", items: [
        { id: "/profile", label: "Profile", icon: UserCheck },
        { id: "/notifications", label: "Notifications", icon: Bell, badge: 3 },
      ]
    }
  ];

  const builderCrmNavGroups: NavGroup[] = [
    {
      label: "Sales Core", items: [
        { id: "/crm?tab=overview", label: "Overview", icon: LayoutDashboard },
        { id: "/crm?tab=leads", label: "Leads", icon: Users },
        { id: "/crm?tab=customers", label: "Customers", icon: IndianRupee },
        { id: "/crm?tab=pipeline", label: "Sales Pipeline", icon: GitCommit },
        { id: "/crm?tab=followups", label: "Follow-ups", icon: Clock },
      ]
    },
    {
      label: "Management & Inventory", items: [
        { id: "/crm?tab=team", label: "CRM Team", icon: Users },
        { id: "/crm?tab=deals", label: "Bookings", icon: IndianRupee },
        { id: "/crm?tab=activities", label: "Site Visits & Tasks", icon: Calendar },
        { id: "/crm?tab=properties", label: "Properties Catalog", icon: Building2 },
        { id: "/crm?tab=reports", label: "Reports", icon: FileBarChart },
      ]
    },
    {
      label: "Administration", items: [
        { id: "/crm?tab=settings", label: "CRM Settings", icon: Settings },
        { id: "/notifications", label: "Notifications", icon: Bell, badge: 3 },
      ]
    }
  ];

  let selectedCrmGroups = builderCrmNavGroups;
  if (crmRole === 'TELECALLER') {
    selectedCrmGroups = telecallerCrmNavGroups;
  } else if (crmRole === 'CRM_MANAGER') {
    selectedCrmGroups = managerCrmNavGroups;
  }

  const activeNavGroups = mode === 'CRM' ? selectedCrmGroups : erpNavGroups;

  const filteredGroups = activeNavGroups.map(group => {
    let items = group.items;
    if (mode === 'ERP') {
      if (role === 'ACCOUNTANT') {
        const allowed = ['/dashboard', '/finance', '/purchase', '/operations', '/reports', '/boq', '/purchase-orders', '/inventory', '/vendors', '/documents', '/notifications', '/settings'];
        items = items.filter(item => allowed.includes(item.id));
      } else if (role === 'PROJECT_MANAGER') {
        const allowed = ['/dashboard', '/projects', '/progress', '/purchase', '/finance', '/operations', '/boq', '/material-requests', '/purchase-orders', '/inventory', '/vendors', '/dpr', '/documents', '/reports', '/milestone-report', '/notifications', '/settings'];
        items = items.filter(item => allowed.includes(item.id));
      }
      if (role !== 'BUILDER') {
        items = items.filter(item => item.id !== '/users');
      }
    }
    return { ...group, items };
  }).filter(group => group.items.length > 0);

  return (
    <div className="flex flex-col h-full bg-[#2648E7] text-white border-r border-[#2648E7] overflow-hidden">
      {/* Logo / Brand Header */}
      <div className="px-4 py-4 border-b border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <Logo size="md" variant="light" />
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 ml-2 shrink-0">
            <X className="w-4 h-4 text-white" />
          </button>
        )}
      </div>

      {/* Mode Switcher Pill (ERP <-> CRM) — VISIBLE TO BUILDER OR DUAL-ROLE (ERP+CRM) USERS */}
      {canSwitchMode && (
        <div className="px-3 py-2.5 border-b border-white/10 bg-black/10 shrink-0">
          <div className="flex bg-black/25 p-1 rounded-xl relative">
            <button
              type="button"
              onClick={() => setMode('ERP')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                mode === 'ERP'
                  ? 'bg-white text-[#2648E7] shadow-md scale-100'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <Layers size={13} />
              <span>ERP</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('CRM')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                mode === 'CRM'
                  ? 'bg-[#FCC300] text-[#0D1117] shadow-md scale-100'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sparkles size={13} />
              <span>CRM</span>
              {entitlements && !entitlements.has_crm && (
                <Lock size={11} className="text-amber-300 ml-0.5 shrink-0" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Single-role CRM mode header badge */}
      {!canSwitchMode && mode === 'CRM' && (
        <div className="px-4 py-2.5 border-b border-white/10 bg-black/10 shrink-0 flex items-center gap-2">
          <div className="size-6 rounded-lg bg-[#FCC300] flex items-center justify-center text-[#0D1117]">
            <Sparkles size={13} />
          </div>
          <div>
            <p className="text-[10px] text-white/60 uppercase font-black tracking-wider">Workspace</p>
            <p className="text-xs font-extrabold text-white leading-tight">
              {crmRole === 'CRM_MANAGER' ? 'CRM Manager Portal' : 'Telecaller CRM'}
            </p>
          </div>
        </div>
      )}

      {/* Active Project Banner (in ERP mode) */}
      {mode === 'ERP' && activeProject && (
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

              // CRM tab active logic
              let isActive = false;
              if (item.id.startsWith('/crm')) {
                if (item.id === '/crm?tab=overview') {
                  isActive = location.pathname === '/crm' && (location.search === '' || location.search.includes('tab=overview'));
                } else {
                  isActive = pathWithSearch === item.id;
                }
              } else {
                isActive = pathWithSearch === targetPath || (item.id === '/dashboard' && location.pathname === '/');
              }

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

      {/* Bottom Profile & Logout */}
      <div className="px-4 py-4 border-t border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-full bg-[#FCC300] flex items-center justify-center text-[#0D1117] font-bold text-sm shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate leading-tight">{user?.name || 'Aditya Sharma'}</p>
            <p className="text-[10px] text-white/60 truncate leading-tight">
              {crmRole === 'CRM_MANAGER'
                ? 'CRM Manager'
                : crmRole === 'TELECALLER'
                ? 'Sales Executive'
                : user?.role ? user.role.replace(/_/g, ' ') : 'Builder'}
            </p>
          </div>
          <button onClick={logout} className="text-white/50 hover:text-white transition-colors p-1" title="Logout">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
