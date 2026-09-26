import { apiClient } from './client';

// ─── Types ────────────────────────────────────────────────

export interface HealthFactor {
  score: number;
  status: 'OPTIMAL' | 'WATCH' | 'CRITICAL';
}

export interface QomVariance {
  id: string;
  name: string;
  materialName: string;
  unit: string;
  planned: number;
  used: number;
  remaining: number;
  percentUsed: number;
  variance: number;
  status: 'normal' | 'high' | 'excess' | 'low_remaining';
}

export interface WorkTableItem {
  id: string;
  name: string;
  materialName: string;
  unit: string;
  planned: number;
  used: number;
  remaining: number;
  percentUsed: number;
  variance: number;
  status: 'normal' | 'high' | 'excess' | 'low_remaining';
  rate?: number;
  plannedCost?: number;
  usedCost?: number;
}

export interface WorkTableSummary {
  id: string;
  name: string;
  itemsCount: number;
  totalPlannedCost: number;
  totalUsedCost: number;
  totalVarianceCost: number;
  percentUsed: number;
  status: 'optimal' | 'watch' | 'critical';
  statusLabel: string;
  overusedCount: number;
  lowRemainingCount: number;
  items: WorkTableItem[];
}

export interface WorkTableStats {
  totalTables: number;
  optimalTables: number;
  watchTables: number;
  criticalTables: number;
  totalPlannedCost: number;
  totalUsedCost: number;
  overallPercentUsed: number;
}

export interface MilestoneComparison {
  id: string;
  name: string;
  targetDate: string;
  actualDate: string | null;
  status: string;
  plannedProgress: number;
  actualProgress: number;
  variance: number;
  isOverdue: boolean;
  daysOverdue: number;
  weight: number;
}

export interface Bottleneck {
  type: string;
  title: string;
  reason: string;
  affectedArea: string;
  severity: 'high' | 'medium' | 'low';
  action: string;
}

export interface Insight {
  type: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  detail: string;
  action: string;
}

export interface IntelligenceSuggestion {
  id: string;
  project_id: string;
  company_id: string | null;
  type: string;
  name: string;
  description: string | null;
  suggested_start: string | null;
  suggested_end: string | null;
  duration_days: number | null;
  reason: string | null;
  source: string | null;
  status: 'SUGGESTED' | 'APPROVED' | 'REMOVED';
  approved_at: string | null;
  approved_by: string | null;
  milestone_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectIntelligenceData {
  project: {
    id: string;
    name: string;
    status: string;
    budget: number | null;
    actualSpend: number;
    startDate: string;
    endDate: string | null;
    progressPercentage: number;
  };
  health: {
    compositeScore: number;
    overallStatus: string;
    factors: {
      finance: HealthFactor;
      procurement: HealthFactor;
      schedule: HealthFactor;
      operations: HealthFactor;
    };
    budgetUtilization: number;
    actualSpend: number;
    totalBudget: number;
    budgetBreakdown: { category: string; allocated: number; spent: number; utilization: number }[];
    pendingPaymentExposure: number;
    pendingPaymentCount: number;
  };
  qomVariances: QomVariance[];
  workTables?: WorkTableSummary[];
  workTableStats?: WorkTableStats;
  milestoneComparison: MilestoneComparison[];
  overallScheduleProgress: number;
  procurement: {
    delayedPOs: { id: string; poNumber: string; vendor: string; deliveryDate: string; amount: number; status: string }[];
    lowStockItems: { material: string; unit: string; current: number; minimum: number; site: string }[];
    pendingRequests: number;
  };
  workforce: {
    todayCount: number;
    todayCost: number;
    dprSubmitted: number;
    activeSites: number;
    equipmentRunning: number;
  };
  bottlenecks: Bottleneck[];
  insights: Insight[];
  suggestions: IntelligenceSuggestion[];
  milestonesExist: boolean;
  hasBudget: boolean;
  hasBoq: boolean;
}

// ─── API Methods ──────────────────────────────────────────

export const projectIntelligenceApi = {
  /** Get comprehensive intelligence data for a project */
  getData: (projectId: string) =>
    apiClient.get<ProjectIntelligenceData>(`/project-intelligence?project_id=${projectId}`, { noCache: true }),

  /** Get all suggestions for a project */
  getSuggestions: (projectId: string) =>
    apiClient.get<IntelligenceSuggestion[]>(`/project-intelligence/suggestions?project_id=${projectId}`, { noCache: true }),

  /** Generate suggested milestones based on area, floors, bhk and timeline */
  generateSuggestions: (
    projectId: string,
    params?: {
      builtUpArea?: number;
      floors?: number | string;
      bhk?: number | string;
      startDate?: string;
      constructionPace?: 'FAST' | 'STANDARD' | 'RELAXED';
    }
  ) =>
    apiClient.post<IntelligenceSuggestion[]>('/project-intelligence/suggestions', {
      project_id: projectId,
      action: 'generate',
      ...(params || {}),
    }),

  /** Create a manual suggestion */
  createSuggestion: (data: {
    project_id: string;
    name: string;
    description?: string;
    suggested_start?: string;
    suggested_end?: string;
    duration_days?: number;
    reason?: string;
  }) =>
    apiClient.post<IntelligenceSuggestion>('/project-intelligence/suggestions', {
      ...data,
      action: 'create',
    }),

  /** Edit a suggestion */
  updateSuggestion: (id: string, data: {
    name?: string;
    description?: string;
    suggested_start?: string;
    suggested_end?: string;
    duration_days?: number;
    reason?: string;
  }) =>
    apiClient.patch<IntelligenceSuggestion>(`/project-intelligence/suggestions/${id}`, data),

  /** Remove a suggestion */
  removeSuggestion: (id: string) =>
    apiClient.delete(`/project-intelligence/suggestions/${id}`),

  /** Cancel the generated plan (clears all pending suggestions) */
  cancelSuggestions: (projectId: string) =>
    apiClient.delete(`/project-intelligence/suggestions?project_id=${projectId}`),

  /** Approve a single suggestion */
  approveSuggestion: (suggestionId: string) =>
    apiClient.post('/project-intelligence/suggestions/approve', {
      suggestion_id: suggestionId,
    }),

  /** Approve all suggestions for a project */
  approveAll: (projectId: string) =>
    apiClient.post('/project-intelligence/suggestions/approve', {
      project_id: projectId,
      approve_all: true,
    }),
};
