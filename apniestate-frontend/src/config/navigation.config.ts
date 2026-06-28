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
  BookOpen
} from 'lucide-react';

export interface NavigationItem {
  to: string;
  icon: any;
  label: string;
  permission?: string;
  action?: string;
  badge?: boolean; // Show notification badge
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

// ─── Sidebar Configs ──────────────────────────────────────
const builderSidebar: NavigationSection[] = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/projects', icon: FolderKanban, label: 'Projects', permission: 'projects.read' },
      { to: '/sites', icon: MapPin, label: 'Sites', permission: 'sites.read' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/tasks', icon: ClipboardList, label: 'Tasks', permission: 'tasks.read' },
      { to: '/attendance', icon: UserCheck, label: 'Attendance', permission: 'attendance.read' },
      { to: '/workers', icon: Users, label: 'Workers', permission: 'workers.read' },
      { to: '/inventory', icon: Package, label: 'Inventory', permission: 'inventory.read' },
      { to: '/materials', icon: Boxes, label: 'Materials', permission: 'materials.read' },
    ],
  },
  {
    label: 'Procurement',
    items: [
      { to: '/vendors', icon: Truck, label: 'Vendors', permission: 'vendors.read' },
      { to: '/contractors', icon: HardHat, label: 'Contractors', permission: 'contractors.read' },
      { to: '/documents', icon: FileText, label: 'Documents', permission: 'documents.read' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { to: '/finance', icon: Wallet, label: 'Cashbook', permission: 'finance.read' },
      { to: '/invoices', icon: Receipt, label: 'Invoices', permission: 'invoices.read' },
      { to: '/payments', icon: CreditCard, label: 'Payments', permission: 'payments.read' },
      { to: '/budgets', icon: BarChart3, label: 'Budgets', permission: 'budgets.read' },
      { to: '/payroll', icon: Calculator, label: 'Payroll', permission: 'workers.read' },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { to: '/reports', icon: TrendingUp, label: 'Reports', permission: 'reports.read' },
      { to: '/notifications', icon: Bell, label: 'Notifications', badge: true },
    ],
  },
  {
    label: 'Admin',
    items: [
      { to: '/settings', icon: Settings, label: 'Settings' },
    ],
  },
];

const supervisorSidebar: NavigationSection[] = [
  {
    label: 'Main',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/projects', icon: FolderKanban, label: 'Projects', permission: 'projects.read' },
      { to: '/sites', icon: MapPin, label: 'Sites', permission: 'sites.read' },
      { to: '/tasks', icon: ClipboardList, label: 'Tasks', permission: 'tasks.read' },
      { to: '/attendance', icon: UserCheck, label: 'Attendance', permission: 'attendance.read' },
      { to: '/dpr', icon: ClipboardCheck, label: 'DPR' },
    ],
  },
  {
    label: 'Workforce',
    items: [
      { to: '/workers', icon: Users, label: 'Workers', permission: 'workers.read' },
      { to: '/contractors', icon: HardHat, label: 'Contractors', permission: 'contractors.read' },
      { to: '/leaves', icon: Calendar, label: 'Leaves', permission: 'leaves.read' },
      { to: '/payroll', icon: Calculator, label: 'Payroll', permission: 'workers.read' },
    ],
  },
  {
    label: 'Materials',
    items: [
      { to: '/inventory', icon: Package, label: 'Inventory', permission: 'inventory.read' },
      { to: '/materials', icon: Boxes, label: 'Materials', permission: 'materials.read' },
      { to: '/vendors', icon: Truck, label: 'Vendors', permission: 'vendors.read' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { to: '/finance', icon: Wallet, label: 'Cashbook', permission: 'finance.read' },
      { to: '/invoices', icon: Receipt, label: 'Invoices', permission: 'invoices.read' },
      { to: '/payments', icon: CreditCard, label: 'Payments', permission: 'payments.read' },
      { to: '/budgets', icon: BarChart3, label: 'Budgets', permission: 'budgets.read' },
    ],
  },
  {
    label: 'Reports',
    items: [
      { to: '/documents', icon: FileText, label: 'Documents', permission: 'documents.read' },
      { to: '/reports', icon: TrendingUp, label: 'Reports', permission: 'reports.read' },
      { to: '/notifications', icon: Bell, label: 'Notifications', badge: true },
    ],
  },
  {
    label: 'Admin',
    items: [
      { to: '/settings', icon: Settings, label: 'Settings' },
    ],
  },
];

const pmSidebar: NavigationSection[] = [
  {
    label: 'Main',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/projects', icon: FolderKanban, label: 'Projects', permission: 'projects.read' },
      { to: '/sites', icon: MapPin, label: 'Sites', permission: 'sites.read' },
      { to: '/tasks', icon: ClipboardList, label: 'Tasks', permission: 'tasks.read' },
    ],
  },
  {
    label: 'Resources',
    items: [
      { to: '/workers', icon: Users, label: 'Workers', permission: 'workers.read' },
      { to: '/attendance', icon: UserCheck, label: 'Attendance', permission: 'attendance.read' },
      { to: '/contractors', icon: HardHat, label: 'Contractors', permission: 'contractors.read' },
    ],
  },
  {
    label: 'Materials',
    items: [
      { to: '/materials', icon: Boxes, label: 'Materials', permission: 'materials.read' },
      { to: '/inventory', icon: Package, label: 'Inventory', permission: 'inventory.read' },
      { to: '/vendors', icon: Truck, label: 'Vendors', permission: 'vendors.read' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { to: '/budgets', icon: BarChart3, label: 'Budgets', permission: 'budgets.read' },
      { to: '/finance', icon: Wallet, label: 'Cashbook', permission: 'finance.read' },
      { to: '/payments', icon: CreditCard, label: 'Payments', permission: 'payments.read' },
    ],
  },
  {
    label: 'Reports',
    items: [
      { to: '/reports', icon: TrendingUp, label: 'Reports', permission: 'reports.read' },
      { to: '/documents', icon: FileText, label: 'Documents', permission: 'documents.read' },
      { to: '/notifications', icon: Bell, label: 'Notifications', badge: true },
    ],
  },
  {
    label: 'Admin',
    items: [
      { to: '/settings', icon: Settings, label: 'Settings' },
    ],
  },
];

const accountantSidebar: NavigationSection[] = [
  {
    label: 'Main',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/projects', icon: FolderKanban, label: 'Projects', permission: 'projects.read' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { to: '/finance', icon: Wallet, label: 'Cashbook', permission: 'finance.read' },
      { to: '/invoices', icon: Receipt, label: 'Invoices', permission: 'invoices.read' },
      { to: '/payments', icon: CreditCard, label: 'Payments', permission: 'payments.read' },
      { to: '/budgets', icon: BarChart3, label: 'Budgets', permission: 'budgets.read' },
      { to: '/payroll', icon: Calculator, label: 'Payroll', permission: 'workers.read' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/vendors', icon: Truck, label: 'Vendors', permission: 'vendors.read' },
      { to: '/workers', icon: Users, label: 'Workers', permission: 'workers.read' },
      { to: '/materials', icon: Boxes, label: 'Materials', permission: 'materials.read' },
    ],
  },
  {
    label: 'Reports',
    items: [
      { to: '/reports', icon: TrendingUp, label: 'Reports', permission: 'reports.read' },
      { to: '/documents', icon: FileText, label: 'Documents', permission: 'documents.read' },
      { to: '/notifications', icon: Bell, label: 'Notifications', badge: true },
    ],
  },
  {
    label: 'Admin',
    items: [
      { to: '/settings', icon: Settings, label: 'Settings' },
    ],
  },
];

const adminSidebar: NavigationSection[] = [
  {
    label: 'Main',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/projects', icon: FolderKanban, label: 'Projects', permission: 'projects.read' },
      { to: '/sites', icon: MapPin, label: 'Sites', permission: 'sites.read' },
    ],
  },
  {
    label: 'People',
    items: [
      { to: '/users', icon: Shield, label: 'Users & Roles', permission: 'users.read' },
      { to: '/workers', icon: Users, label: 'Workers', permission: 'workers.read' },
      { to: '/contractors', icon: HardHat, label: 'Contractors', permission: 'contractors.read' },
      { to: '/attendance', icon: UserCheck, label: 'Attendance', permission: 'attendance.read' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/tasks', icon: ClipboardList, label: 'Tasks', permission: 'tasks.read' },
      { to: '/inventory', icon: Package, label: 'Inventory', permission: 'inventory.read' },
      { to: '/materials', icon: Boxes, label: 'Materials', permission: 'materials.read' },
      { to: '/vendors', icon: Truck, label: 'Vendors', permission: 'vendors.read' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { to: '/finance', icon: Wallet, label: 'Cashbook', permission: 'finance.read' },
      { to: '/invoices', icon: Receipt, label: 'Invoices', permission: 'invoices.read' },
      { to: '/payments', icon: CreditCard, label: 'Payments', permission: 'payments.read' },
      { to: '/budgets', icon: BarChart3, label: 'Budgets', permission: 'budgets.read' },
      { to: '/payroll', icon: Calculator, label: 'Payroll', permission: 'workers.read' },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { to: '/reports', icon: TrendingUp, label: 'Reports', permission: 'reports.read' },
      { to: '/documents', icon: FileText, label: 'Documents', permission: 'documents.read' },
      { to: '/notifications', icon: Bell, label: 'Notifications', badge: true },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/settings', icon: Settings, label: 'Settings' },
    ],
  },
];

export function getSidebarConfig(role: string): NavigationSection[] {
  switch (role) {
    case 'BUILDER': return builderSidebar;
    case 'PROJECT_MANAGER': return pmSidebar;
    case 'ACCOUNTANT': return accountantSidebar;
    case 'ADMIN': return adminSidebar;
    default: return supervisorSidebar;
  }
}

// ─── Bottom Navigation Configs ────────────────────────────
const supervisorBottomNav: NavigationItem[] = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/tasks', icon: ClipboardList, label: 'Work' },
  { to: '/inventory', icon: Package, label: 'Inventory' },
  { to: '/more', icon: Menu, label: 'Management' },
];

const builderBottomNav: NavigationItem[] = [
  { to: '/dashboard', icon: Home, label: 'Dashboard' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/reports', icon: BarChart3, label: 'Analytics' },
  { to: '/more', icon: Menu, label: 'More' },
];

const pmBottomNav: NavigationItem[] = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/tasks', icon: ClipboardList, label: 'Tasks' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
  { to: '/more', icon: Menu, label: 'More' },
];

const accountantBottomNav: NavigationItem[] = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/finance', icon: Wallet, label: 'Finance' },
  { to: '/invoices', icon: CheckCircle, label: 'Invoices' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
  { to: '/more', icon: Menu, label: 'More' },
];

export function getBottomNavConfig(role: string): NavigationItem[] {
  switch (role) {
    case 'BUILDER': return builderBottomNav;
    case 'PROJECT_MANAGER': return pmBottomNav;
    case 'ACCOUNTANT': return accountantBottomNav;
    case 'ADMIN': return builderBottomNav;
    default: return supervisorBottomNav;
  }
}

// ─── FAB Actions Configs ──────────────────────────────────
const builderFab: FabAction[] = [
  { label: 'Add Project', icon: Plus, path: '/projects?create=true', color: '#FFFFFF', bg: '#0891B2' },
  { label: 'Projects', icon: FolderKanban, path: '/projects', color: '#FFFFFF', bg: '#0A3D91' },
  { label: 'Sites', icon: MapPin, path: '/sites', color: '#FFFFFF', bg: '#16A34A' },
  { label: 'Approvals', icon: CheckCircle, path: '/dashboard', color: '#111827', bg: '#F4B400' },
  { label: 'Reports', icon: BarChart3, path: '/reports', color: '#FFFFFF', bg: '#0A3D91' },
  { label: 'Analytics', icon: TrendingUp, path: '/reports', color: '#FFFFFF', bg: '#8B5CF6' },
  { label: 'Organization', icon: Building2, path: '/settings', color: '#FFFFFF', bg: '#16A34A' },
  { label: 'Settings', icon: Settings, path: '/settings', color: '#FFFFFF', bg: '#374151' },
];

const supervisorFab: FabAction[] = [
  { label: 'Attendance', icon: UserCheck, path: '/attendance', color: '#FFFFFF', bg: '#0A3D91' },
  { label: 'DPR', icon: ClipboardCheck, path: '/dpr', color: '#FFFFFF', bg: '#16A34A' },
  { label: 'Workers', icon: Users, path: '/workers', color: '#FFFFFF', bg: '#0A3D91' },
  { label: 'Tasks', icon: ClipboardList, path: '/tasks', color: '#FFFFFF', bg: '#16A34A' },
  { label: 'Inventory', icon: Package, path: '/inventory', color: '#111827', bg: '#F4B400' },
  { label: 'Materials', icon: Boxes, path: '/materials', color: '#FFFFFF', bg: '#DC2626' },
  { label: 'Cashbook', icon: Wallet, path: '/finance', color: '#FFFFFF', bg: '#0A3D91' },
];

const pmFab: FabAction[] = [
  { label: 'Add Project', icon: Plus, path: '/projects?create=true', color: '#FFFFFF', bg: '#0891B2' },
  { label: 'Timeline', icon: Calendar, path: '/projects', color: '#FFFFFF', bg: '#0A3D91' },
  { label: 'Milestones', icon: CheckCircle, path: '/tasks', color: '#FFFFFF', bg: '#16A34A' },
  { label: 'Resources', icon: Users, path: '/workers', color: '#FFFFFF', bg: '#0A3D91' },
  { label: 'Risks', icon: AlertTriangle, path: '/dashboard', color: '#FFFFFF', bg: '#DC2626' },
];

const accountantFab: FabAction[] = [
  { label: 'Invoices', icon: FileText, path: '/invoices', color: '#FFFFFF', bg: '#16A34A' },
  { label: 'Expenses', icon: Wallet, path: '/finance', color: '#FFFFFF', bg: '#DC2626' },
  { label: 'Payroll', icon: Calculator, path: '/payroll', color: '#FFFFFF', bg: '#0A3D91' },
  { label: 'Cashbook', icon: Receipt, path: '/finance', color: '#FFFFFF', bg: '#0A3D91' },
  { label: 'Reports', icon: BarChart3, path: '/reports', color: '#111827', bg: '#F4B400' },
];

const adminFab: FabAction[] = [
  { label: 'Users', icon: Users, path: '/users', color: '#FFFFFF', bg: '#0A3D91' },
  { label: 'Roles', icon: Layers, path: '/users', color: '#FFFFFF', bg: '#8B5CF6' },
  { label: 'Permissions', icon: Shield, path: '/users', color: '#FFFFFF', bg: '#DC2626' },
  { label: 'Organization', icon: Building2, path: '/settings', color: '#FFFFFF', bg: '#16A34A' },
  { label: 'Settings', icon: Settings, path: '/settings', color: '#FFFFFF', bg: '#374151' },
];

export function getFabConfig(role: string): FabAction[] {
  switch (role) {
    case 'BUILDER': return builderFab;
    case 'PROJECT_MANAGER': return pmFab;
    case 'SITE_SUPERVISOR': return supervisorFab;
    case 'ACCOUNTANT': return accountantFab;
    case 'ADMIN': return adminFab;
    default: return supervisorFab;
  }
}
