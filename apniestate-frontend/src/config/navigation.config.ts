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
  User,
  Download,
  FileDown,
  Flag,
  CalendarDays,
  ShoppingBag,
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

// ─── Unified Sidebar Config (matching Figma groups exactly) ────────────────────

const masterSidebar: NavigationSection[] = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
    ],
  },
  {
    label: 'Field Operations',
    items: [
      { to: '/daily-logs', icon: ClipboardList, label: 'Daily Logs' },
      { to: '/attendance', icon: UserCheck, label: 'Attendance' },
      { to: '/workers', icon: HardHat, label: 'Workers' },
      { to: '/dpr', icon: ClipboardCheck, label: 'Daily Progress Report' },
    ],
  },
  {
    label: 'Materials',
    items: [
      { to: '/materials', icon: Boxes, label: 'Materials Master' },
      { to: '/inventory', icon: Package, label: 'Inventory' },
      { to: '/material-requests', icon: ShoppingCart, label: 'Material Requests' },
    ],
  },
  {
    label: 'Planning',
    items: [
      { to: '/projects', icon: FolderKanban, label: 'Projects' },
      { to: '/sites', icon: MapPin, label: 'Sites' },
      { to: '/tasks', icon: Flag, label: 'Milestones' },
      { to: '/timeline', icon: CalendarDays, label: 'Timeline' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { to: '/finance', icon: BookOpen, label: 'Cashbook' },
      { to: '/budgets', icon: BarChart3, label: 'Budgets' },
      { to: '/invoices', icon: ShoppingBag, label: 'Purchase Orders' },
      { to: '/finance', icon: Receipt, label: 'Expenses' },
      { to: '/invoices', icon: FileText, label: 'Invoices' },
      { to: '/payments', icon: CreditCard, label: 'Vendor Payments' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/equipment', icon: Truck, label: 'Equipment Usage' },
      { to: '/payroll', icon: Calculator, label: 'Payroll' },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { to: '/reports', icon: BarChart3, label: 'Reports & Analytics' },
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
    label: 'Tools',
    items: [
      { to: '/export-attendance', icon: Download, label: 'Export Attendance' },
      { to: '/export-dpr', icon: FileDown, label: 'Export DPR' },
      { to: '/notifications', icon: Bell, label: 'Notifications', badge: true },
      { to: '/calendar', icon: Calendar, label: 'Calendar' },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/settings', icon: User, label: 'Profile Settings' },
    ],
  },
];

export function getSidebarConfig(role: string): NavigationSection[] {
  return masterSidebar;
}

// ─── Bottom Nav Config (Hybrid: Home, Attend, Finance, Alerts, Profile) ────────

const builderBottomNav: NavigationItem[] = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/attendance', icon: UserCheck, label: 'Attend' },
  { to: '/finance', icon: Wallet, label: 'Finance' },
  { to: '/notifications', icon: Bell, label: 'Alerts', badge: true },
  { to: '/settings', icon: User, label: 'Profile' },
];

const pmBottomNav: NavigationItem[] = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/tasks', icon: ClipboardList, label: 'Tasks' },
  { to: '/notifications', icon: Bell, label: 'Alerts', badge: true },
  { to: '/settings', icon: User, label: 'Profile' },
];

const supervisorBottomNav: NavigationItem[] = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/attendance', icon: UserCheck, label: 'Attend' },
  { to: '/dpr', icon: ClipboardCheck, label: 'DPR' },
  { to: '/notifications', icon: Bell, label: 'Alerts', badge: true },
  { to: '/settings', icon: User, label: 'Profile' },
];

const accountantBottomNav: NavigationItem[] = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/finance', icon: Wallet, label: 'Finance' },
  { to: '/invoices', icon: Receipt, label: 'Invoices' },
  { to: '/notifications', icon: Bell, label: 'Alerts', badge: true },
  { to: '/settings', icon: User, label: 'Profile' },
];

export function getBottomNavConfig(role: string): NavigationItem[] {
  switch (role) {
    case 'BUILDER':
    case 'ADMIN':
      return builderBottomNav;
    case 'PROJECT_MANAGER':
      return pmBottomNav;
    case 'SITE_SUPERVISOR':
      return supervisorBottomNav;
    case 'ACCOUNTANT':
      return accountantBottomNav;
    default:
      return builderBottomNav;
  }
}

// ─── Unified FAB Actions Config (Max 6) ───────────────────

const masterFab: FabAction[] = [
  { label: 'Create Project', icon: Plus, path: '/projects?create=true', color: '#FFFFFF', bg: '#0891B2' },
  { label: 'Create Task', icon: ClipboardList, path: '/tasks', color: '#FFFFFF', bg: '#3B82F6' },
  { label: 'Mark Attendance', icon: UserCheck, path: '/attendance', color: '#FFFFFF', bg: '#16A34A' },
  { label: 'Create DPR', icon: ClipboardCheck, path: '/dpr', color: '#0D1117', bg: '#FCC300' },
  { label: 'Record Expense', icon: Receipt, path: '/finance', color: '#FFFFFF', bg: '#DC2626' },
  { label: 'Req Material', icon: Package, path: '/material-requests', color: '#FFFFFF', bg: '#8B5CF6' },
];

export function getFabConfig(role: string): FabAction[] {
  return masterFab;
}

// ─── Unified Quick Actions Config ─────────────────────────

const masterQA: QuickAction[] = [
  { label: 'Approvals', icon: CheckCircle, path: '/approvals', color: '#FCC300', bg: 'rgba(252, 195, 0, 0.1)' },
  { label: 'New Project', icon: FolderKanban, path: '/projects?create=true', color: '#0891B2', bg: 'rgba(8, 145, 178, 0.1)' },
  { label: 'Attendance', icon: UserCheck, path: '/attendance', color: '#2648E7', bg: 'rgba(38, 72, 231, 0.1)' },
  { label: 'DPR', icon: ClipboardCheck, path: '/dpr', color: '#16A34A', bg: 'rgba(22, 163, 74, 0.1)' },
];

export function getQuickActionsConfig(role: string): QuickAction[] {
  return masterQA;
}

// ─── Route Authorization Helper ──────────────────────────

export function isRouteVisible(path: string, role: string): boolean {
  return true;
}
