import {
  LayoutDashboard,
  FolderKanban,
  MapPin,
  ClipboardList,
  UserCheck,
  Package,
  Boxes,
  Truck,
  Users,
  Layers,
  Calendar,
  Wallet,
  FileText,
  BarChart3,
  Settings,
  Shield,
  Calculator,
  Receipt,
  CheckCircle,
  ShoppingCart,
  Search,
  Menu,
  Home,
  ClipboardCheck,
  TrendingUp,
  AlertTriangle,
  Plus,
  Building2,
  Bell,
  Activity,
  HardHat,
  Wrench,
  CreditCard,
  BookOpen,
  PieChart,
  UserPlus,
  ArrowRight,
  Briefcase,
  User
} from 'lucide-react';

export interface NavigationItem {
  to: string;
  icon: any;
  label: string;
  permission?: string;
  action?: string;
  badge?: boolean;
}

export interface NavigationSection {
  label: string;
  items: NavigationItem[];
}

export interface FabAction {
  label: string;
  icon: any;
  path: string;
  color: string;
  bg: string;
  action?: string;
}

export interface QuickAction {
  label: string;
  icon: any;
  path: string;
  color: string;
  bg: string;
}

// ─── Unified Sidebar Config ────────────────────────────────

const masterSidebar: NavigationSection[] = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/projects', icon: FolderKanban, label: 'Projects' },
      { to: '/sites', icon: MapPin, label: 'Sites' },
      { to: '/approvals', icon: CheckCircle, label: 'Approvals' },
      { to: '/tasks', icon: ClipboardList, label: 'Tasks' },
    ],
  },
  {
    label: 'Daily Logs',
    items: [
      { to: '/attendance', icon: UserCheck, label: 'Attendance' },
      { to: '/workers', icon: Users, label: 'Workers' },
      { to: '/dpr', icon: ClipboardCheck, label: 'Daily Progress Report' },
    ],
  },
  {
    label: 'Materials',
    items: [
      { to: '/inventory', icon: Package, label: 'Inventory' },
      { to: '/materials', icon: Boxes, label: 'Materials' },
      { to: '/inventory', icon: ShoppingCart, label: 'Material Requests' },
    ],
  },
  {
    label: 'Execution',
    items: [
      { to: '/tasks', icon: Layers, label: 'Milestones' },
      { to: '/projects', icon: Calendar, label: 'Timeline' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { to: '/finance', icon: Wallet, label: 'Cashbook' },
      { to: '/budgets', icon: BarChart3, label: 'Budgets' },
      { to: '/invoices', icon: Receipt, label: 'Purchase Orders' },
      { to: '/finance', icon: Receipt, label: 'Expenses' },
      { to: '/invoices', icon: FileText, label: 'Invoices' },
      { to: '/payments', icon: CreditCard, label: 'Vendor Payments' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/inventory', icon: Wrench, label: 'Equipment Usage' },
      { to: '/payroll', icon: Calculator, label: 'Payroll' },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { to: '/reports', icon: TrendingUp, label: 'Reports' },
      { to: '/reports', icon: PieChart, label: 'Analytics' },
      { to: '/documents', icon: FileText, label: 'Documents' },
    ],
  },
  {
    label: 'Admin',
    items: [
      { to: '/users', icon: Shield, label: 'Users' },
      { to: '/settings', icon: Building2, label: 'Company Settings' },
    ],
  },
  {
    label: 'Actions',
    items: [
      { to: '/attendance', icon: BookOpen, label: 'Export Attendance' },
      { to: '/dpr', icon: BookOpen, label: 'Export DPR' },
    ],
  },
  {
    label: 'Personal',
    items: [
      { to: '/notifications', icon: Bell, label: 'Notifications', badge: true },
      { to: '/calendar', icon: Calendar, label: 'Calendar' },
      { to: '/profile', icon: UserCheck, label: 'Profile' },
      { to: '/settings', icon: Settings, label: 'Settings' },
    ],
  },
];

export function getSidebarConfig(role: string): NavigationSection[] {
  return masterSidebar;
}

// ─── Unified Bottom Navigation Config ─────────────────────

const masterBottomNav: NavigationItem[] = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/tasks', icon: ClipboardList, label: 'Tasks' },
  { to: '/finance', icon: Wallet, label: 'Finance' },
  { to: '/more', icon: Menu, label: 'Menu' },
];

export function getBottomNavConfig(role: string): NavigationItem[] {
  return masterBottomNav;
}

// ─── Unified FAB Actions Config (Max 6) ───────────────────

const masterFab: FabAction[] = [
  { label: 'Create Project', icon: Plus, path: '/projects?create=true', color: '#FFFFFF', bg: '#0891B2' },
  { label: 'Create Task', icon: ClipboardList, path: '/tasks', color: '#FFFFFF', bg: '#3B82F6' },
  { label: 'Mark Attendance', icon: UserCheck, path: '/attendance', color: '#FFFFFF', bg: '#16A34A' },
  { label: 'Create DPR', icon: ClipboardCheck, path: '/dpr', color: '#111827', bg: '#F4B400' },
  { label: 'Record Expense', icon: Receipt, path: '/finance', color: '#FFFFFF', bg: '#DC2626' },
  { label: 'Req Material', icon: Package, path: '/materials', color: '#FFFFFF', bg: '#8B5CF6' },
];

export function getFabConfig(role: string): FabAction[] {
  return masterFab;
}

// ─── Unified Quick Actions Config ─────────────────────────

const masterQA: QuickAction[] = [
  { label: 'Approvals', icon: CheckCircle, path: '/approvals', color: '#F4B400', bg: 'rgba(244, 180, 0, 0.1)' },
  { label: 'New Project', icon: FolderKanban, path: '/projects?create=true', color: '#0891B2', bg: 'rgba(8, 145, 178, 0.1)' },
  { label: 'Attendance', icon: UserCheck, path: '/attendance', color: '#0A3D91', bg: 'rgba(10, 61, 145, 0.1)' },
  { label: 'DPR', icon: ClipboardCheck, path: '/dpr', color: '#16A34A', bg: 'rgba(22, 163, 74, 0.1)' },
];

export function getQuickActionsConfig(role: string): QuickAction[] {
  return masterQA;
}

// ─── Route Authorization Helper ──────────────────────────

export function isRouteVisible(path: string, role: string): boolean {
  // Always return true to disable role-based route protection for now
  return true;
}
