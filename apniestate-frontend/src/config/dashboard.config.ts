import {
  FolderKanban,
  Briefcase,
  Users,
  Wallet,
  BarChart3,
  Clock,
  AlertTriangle,
  ClipboardList,
  Calendar,
  TrendingUp,
  FileText,
  Shield,
  Activity,
  Calculator
} from 'lucide-react';

export interface WidgetConfig {
  id: string;
  title: string;
  icon: any;
  permission?: string;
  priority: number;
  apiPath: string;
  desktopSpan: number; // grid columns out of 12 or 2
  tabletSpan: number;
  mobileSpan: number;
  animationDelay: number;
  emptyMessage: string;
}

export interface DashboardConfig {
  role: string;
  widgets: WidgetConfig[];
}

export const builderDashboardConfig: DashboardConfig = {
  role: 'BUILDER',
  widgets: [
    {
      id: 'kpis',
      title: 'Executive Portfolio KPIs',
      icon: BarChart3,
      priority: 1,
      apiPath: '/dashboard/builder',
      desktopSpan: 12,
      tabletSpan: 12,
      mobileSpan: 12,
      animationDelay: 0.1,
      emptyMessage: 'No overview data available'
    },
    {
      id: 'alerts',
      title: 'Critical Business Alerts',
      icon: AlertTriangle,
      priority: 2,
      apiPath: '/dashboard/builder',
      desktopSpan: 12,
      tabletSpan: 12,
      mobileSpan: 12,
      animationDelay: 0.2,
      emptyMessage: 'No critical alerts today'
    },
    {
      id: 'project_intelligence',
      title: 'Project Portfolio Intelligence',
      icon: FolderKanban,
      priority: 3,
      apiPath: '/dashboard/builder',
      desktopSpan: 6,
      tabletSpan: 12,
      mobileSpan: 12,
      animationDelay: 0.3,
      emptyMessage: 'No active projects under management'
    },
    {
      id: 'approvals',
      title: 'Executive Approval Center',
      icon: ClipboardList,
      priority: 4,
      apiPath: '/dashboard/builder',
      desktopSpan: 6,
      tabletSpan: 12,
      mobileSpan: 12,
      animationDelay: 0.4,
      emptyMessage: 'No pending approvals'
    },
    {
      id: 'calendar',
      title: 'Unified Construction Calendar',
      icon: Calendar,
      priority: 5,
      apiPath: '/dashboard/builder',
      desktopSpan: 6,
      tabletSpan: 12,
      mobileSpan: 12,
      animationDelay: 0.5,
      emptyMessage: 'No milestones scheduled'
    },
    {
      id: 'expenses',
      title: 'Recent Financial Expenses',
      icon: TrendingUp,
      priority: 6,
      apiPath: '/dashboard/builder',
      desktopSpan: 6,
      tabletSpan: 12,
      mobileSpan: 12,
      animationDelay: 0.6,
      emptyMessage: 'No audited expenses recorded'
    }
  ]
};

export const supervisorDashboardConfig: DashboardConfig = {
  role: 'SITE_SUPERVISOR',
  widgets: [
    {
      id: 'current_project',
      title: 'Active Construction Site',
      icon: Briefcase,
      priority: 1,
      apiPath: '/projects/current',
      desktopSpan: 12,
      tabletSpan: 12,
      mobileSpan: 12,
      animationDelay: 0.1,
      emptyMessage: 'No active project assigned'
    },
    {
      id: 'attendance',
      title: 'Labor Attendance Summary',
      icon: Users,
      priority: 2,
      apiPath: '/attendance/summary',
      desktopSpan: 6,
      tabletSpan: 12,
      mobileSpan: 12,
      animationDelay: 0.2,
      emptyMessage: 'No attendance recorded today'
    },
    {
      id: 'tasks',
      title: 'Today\'s Task Checklist',
      icon: ClipboardList,
      priority: 3,
      apiPath: '/tasks/today',
      desktopSpan: 6,
      tabletSpan: 12,
      mobileSpan: 12,
      animationDelay: 0.3,
      emptyMessage: 'No tasks scheduled for today'
    },
    {
      id: 'activities',
      title: 'Live Site Timeline',
      icon: Activity,
      priority: 4,
      apiPath: '/activities/recent',
      desktopSpan: 6,
      tabletSpan: 12,
      mobileSpan: 12,
      animationDelay: 0.4,
      emptyMessage: 'No recent activity logs'
    },
    {
      id: 'materials',
      title: 'Critical Inventory Alerts',
      icon: FileText,
      priority: 5,
      apiPath: '/materials/pending',
      desktopSpan: 6,
      tabletSpan: 12,
      mobileSpan: 12,
      animationDelay: 0.5,
      emptyMessage: 'No pending inventory requests'
    }
  ]
};

export const pmDashboardConfig: DashboardConfig = {
  role: 'PROJECT_MANAGER',
  widgets: [
    {
      id: 'pm_projects',
      title: 'Project Timelines & Progress',
      icon: FolderKanban,
      priority: 1,
      apiPath: '/projects',
      desktopSpan: 12,
      tabletSpan: 12,
      mobileSpan: 12,
      animationDelay: 0.1,
      emptyMessage: 'No projects assigned to manage'
    },
    {
      id: 'pm_tasks',
      title: 'Milestone Progress Tracker',
      icon: ClipboardList,
      priority: 2,
      apiPath: '/tasks',
      desktopSpan: 6,
      tabletSpan: 12,
      mobileSpan: 12,
      animationDelay: 0.2,
      emptyMessage: 'No active tasks found'
    },
    {
      id: 'pm_resources',
      title: 'Resource Allocation Details',
      icon: Users,
      priority: 3,
      apiPath: '/workers',
      desktopSpan: 6,
      tabletSpan: 12,
      mobileSpan: 12,
      animationDelay: 0.3,
      emptyMessage: 'No resource allocations documented'
    }
  ]
};

export const accountantDashboardConfig: DashboardConfig = {
  role: 'ACCOUNTANT',
  widgets: [
    {
      id: 'ac_expenses',
      title: 'Voucher Expense Approvals',
      icon: Calculator,
      priority: 1,
      apiPath: '/finance',
      desktopSpan: 6,
      tabletSpan: 12,
      mobileSpan: 12,
      animationDelay: 0.1,
      emptyMessage: 'No pending expense vouchers'
    },
    {
      id: 'ac_invoices',
      title: 'Outstanding Invoices',
      icon: FileText,
      priority: 2,
      apiPath: '/invoices',
      desktopSpan: 6,
      tabletSpan: 12,
      mobileSpan: 12,
      animationDelay: 0.2,
      emptyMessage: 'No outstanding invoices'
    },
    {
      id: 'ac_payments',
      title: 'Supplier Payments Log',
      icon: Wallet,
      priority: 3,
      apiPath: '/payments',
      desktopSpan: 12,
      tabletSpan: 12,
      mobileSpan: 12,
      animationDelay: 0.3,
      emptyMessage: 'No recorded payments found'
    }
  ]
};

export const adminDashboardConfig: DashboardConfig = {
  role: 'ADMIN',
  widgets: [
    {
      id: 'admin_users',
      title: 'Organization Members & Roles',
      icon: Shield,
      priority: 1,
      apiPath: '/users',
      desktopSpan: 6,
      tabletSpan: 12,
      mobileSpan: 12,
      animationDelay: 0.1,
      emptyMessage: 'No other company members found'
    },
    {
      id: 'admin_audit',
      title: 'System Activity logs',
      icon: Activity,
      priority: 2,
      apiPath: '/activities/recent',
      desktopSpan: 6,
      tabletSpan: 12,
      mobileSpan: 12,
      animationDelay: 0.2,
      emptyMessage: 'No system operations logged'
    }
  ]
};

export function getDashboardConfig(role: string): DashboardConfig {
  switch (role) {
    case 'BUILDER': return builderDashboardConfig;
    case 'PROJECT_MANAGER': return pmDashboardConfig;
    case 'SITE_SUPERVISOR': return supervisorDashboardConfig;
    case 'ACCOUNTANT': return accountantDashboardConfig;
    case 'ADMIN': return adminDashboardConfig;
    default: return supervisorDashboardConfig;
  }
}
