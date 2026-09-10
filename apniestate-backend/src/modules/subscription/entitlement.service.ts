import { prisma } from "@/lib/prisma";
import { SubscriptionStatus } from "@prisma/client";

export type CommercialPlanId = "BASIC" | "PROFESSIONAL" | "ENTERPRISE";

export interface PlanConfig {
  id: CommercialPlanId;
  name: string;
  badge: string;
  setupCost: number; // One-time setup fee (1,00,000 | 1,50,000 | 2,00,000)
  monthlyPrice: number; // Monthly recurring fee (10,000 | 20,000 | 40,000)
  basePrice: number; // Maintained for backward-compat (same as monthlyPrice)
  maxActiveProjects: number; // 1, 3, or Infinity
  hasCRM: boolean;
  hasConstruction: boolean;
  allowedDurations: number[]; // [1, 4, 6, 12]
  description: string;
  features: string[];
}

export const DURATION_DISCOUNTS: Record<number, { discountRate: number; label: string }> = {
  1: { discountRate: 0, label: "No Discount" },
  4: { discountRate: 0.10, label: "10% Discount" },
  6: { discountRate: 0.20, label: "20% Discount" },
  12: { discountRate: 0.35, label: "35% Discount" },
};

const PLAN_BASIC: PlanConfig = {
  id: "BASIC",
  name: "Basic",
  badge: "Basic",
  setupCost: 100000,
  monthlyPrice: 10000,
  basePrice: 10000,
  maxActiveProjects: 1,
  hasCRM: false,
  hasConstruction: true,
  allowedDurations: [1, 4, 6, 12],
  description: "Essential construction management for individual builders & single-site developers.",
  features: [
    "1 Active Project limit",
    "Full Construction Management",
    "BOQ, DPR & Site Attendance",
    "Materials & Inventory tracking",
    "Finance & Cashbook entries",
    "CRM: Not Included",
  ],
};

const PLAN_PROFESSIONAL: PlanConfig = {
  id: "PROFESSIONAL",
  name: "Professional",
  badge: "Professional",
  setupCost: 150000,
  monthlyPrice: 20000,
  basePrice: 20000,
  maxActiveProjects: 3,
  hasCRM: false,
  hasConstruction: true,
  allowedDurations: [1, 4, 6, 12],
  description: "Designed for growing developers managing up to 3 active construction sites.",
  features: [
    "Up to 3 Active Projects",
    "Full Construction Management",
    "BOQ, DPR & Site Attendance",
    "Materials & Inventory tracking",
    "Finance & Cashbook entries",
    "Multi-site supervision",
    "CRM: Not Included",
  ],
};

const PLAN_ENTERPRISE: PlanConfig = {
  id: "ENTERPRISE",
  name: "Enterprise",
  badge: "Enterprise",
  setupCost: 200000,
  monthlyPrice: 40000,
  basePrice: 40000,
  maxActiveProjects: Infinity,
  hasCRM: true,
  hasConstruction: true,
  allowedDurations: [1, 4, 6, 12],
  description: "Complete Construction ERP + CRM suite with unlimited active projects.",
  features: [
    "Unlimited Active Projects",
    "Full Construction Management",
    "CRM Workspace Included (Leads, Pipeline, Follow-ups, Deals)",
    "BOQ, DPR & Site Attendance",
    "Materials & Inventory tracking",
    "Finance & Cashbook entries",
    "Priority Support & Dedicated Onboarding",
  ],
};

export const COMMERCIAL_PLANS: Record<string, PlanConfig> = {
  BASIC: PLAN_BASIC,
  PROFESSIONAL: PLAN_PROFESSIONAL,
  ENTERPRISE: PLAN_ENTERPRISE,
  // Seamless backward-compatibility for existing DB subscriptions
  PLAN_30K: PLAN_BASIC,
  PLAN_50K: PLAN_PROFESSIONAL,
  PLAN_100K: PLAN_ENTERPRISE,
};

export function resolvePlanKey(rawPlanId?: string | null): CommercialPlanId {
  if (!rawPlanId) return "BASIC";
  if (rawPlanId === "ENTERPRISE" || rawPlanId === "PLAN_100K") return "ENTERPRISE";
  if (rawPlanId === "PROFESSIONAL" || rawPlanId === "PLAN_50K") return "PROFESSIONAL";
  return "BASIC";
}

export interface SubscriptionPriceBreakdown {
  planId: CommercialPlanId;
  durationMonths: number;
  monthlyPrice: number;
  grossSubscriptionPrice: number;
  discountPercentage: number;
  discountAmount: number;
  subscriptionPrice: number;
  setupCost: number;
  totalPrice: number;
  isRenewal: boolean;
}

/**
 * Calculates complete transparent breakdown of subscription price.
 * Formula:
 *  - grossSubscription = monthlyPrice × durationMonths
 *  - discount = grossSubscription × discountRate
 *  - subscriptionAmount = grossSubscription - discount
 *  - setupCost = isRenewal ? 0 : one-time setup fee (Setup cost remains unchanged; discount applies only to subscription)
 *  - total = setupCost + subscriptionAmount
 */
export function calculateSubscriptionBreakdown(
  planId: string,
  durationMonths: number,
  options?: { isRenewal?: boolean }
): SubscriptionPriceBreakdown {
  const normalizedId = resolvePlanKey(planId);
  const plan = COMMERCIAL_PLANS[normalizedId];
  if (!plan) {
    throw new Error(`Invalid plan: ${planId}. Allowed: BASIC, PROFESSIONAL, ENTERPRISE`);
  }
  if (!plan.allowedDurations.includes(durationMonths)) {
    throw new Error(`Invalid duration: ${durationMonths} months. Allowed: ${plan.allowedDurations.join(", ")}`);
  }

  const isRenewal = !!options?.isRenewal;
  const monthlyPrice = plan.monthlyPrice;
  const grossSubscriptionPrice = monthlyPrice * durationMonths;
  const discountInfo = DURATION_DISCOUNTS[durationMonths] || { discountRate: 0 };
  const discountRate = discountInfo.discountRate;
  const discountPercentage = Math.round(discountRate * 100);
  const discountAmount = Math.round(grossSubscriptionPrice * discountRate);
  const subscriptionPrice = grossSubscriptionPrice - discountAmount;
  
  // Setup cost is a one-time cost. Subsequent renewals pay only the monthly plan.
  const setupCost = isRenewal ? 0 : plan.setupCost;
  const totalPrice = setupCost + subscriptionPrice;

  return {
    planId: normalizedId,
    durationMonths,
    monthlyPrice,
    grossSubscriptionPrice,
    discountPercentage,
    discountAmount,
    subscriptionPrice,
    setupCost,
    totalPrice,
    isRenewal,
  };
}

/**
 * Calculates total subscription price (INR) considering setup cost and duration discounts.
 */
export function calculateSubscriptionPrice(
  planId: string,
  durationMonths: number,
  options?: { isRenewal?: boolean }
): number {
  return calculateSubscriptionBreakdown(planId, durationMonths, options).totalPrice;
}

/**
 * Retrieves the latest active or demo subscription for a company.
 */
export async function getCompanySubscription(companyId: string) {
  if (!companyId) return null;

  const subscription = await prisma.subscription.findFirst({
    where: {
      company_id: companyId,
      status: {
        in: [
          SubscriptionStatus.ACTIVE,
          SubscriptionStatus.TRIAL_ACTIVE,
          SubscriptionStatus.EXPIRING_SOON,
          SubscriptionStatus.EXPIRED,
          SubscriptionStatus.PENDING_TRIAL,
        ],
      },
    },
    orderBy: { created_at: "desc" },
  });

  if (!subscription) return null;

  // Check if expired (demo accounts never expire naturally)
  const now = new Date();
  const endDate = subscription.end_date || subscription.expires_at || now;
  const isExpired = !subscription.is_demo && endDate < now;

  if (isExpired && subscription.status !== SubscriptionStatus.EXPIRED && subscription.status !== SubscriptionStatus.TRIAL_EXPIRED) {
    // Graceful auto-update in DB
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: SubscriptionStatus.EXPIRED },
    }).catch((err) => console.warn("Failed to auto-update expired subscription status:", err));

    subscription.status = SubscriptionStatus.EXPIRED;
  }

  return {
    ...subscription,
    is_expired: isExpired,
  };
}

/**
 * Returns comprehensive entitlement summary for a company context.
 */
export async function getCompanyEntitlements(companyId: string | null | undefined) {
  if (!companyId) {
    return {
      company_id: null,
      plan_id: null,
      plan_name: "No Workspace",
      badge: "None",
      base_price: 0,
      status: SubscriptionStatus.NONE,
      is_demo: false,
      is_active: false,
      is_expired: false,
      starts_at: null,
      expires_at: null,
      days_remaining: 0,
      max_projects: 0,
      active_projects_count: 0,
      can_create_project: false,
      can_create_project_reason: "No workspace selected",
      has_crm: false,
      has_construction: false,
    };
  }

  const sub = await getCompanySubscription(companyId);

  // Count active projects (status not COMPLETED or CANCELLED)
  const activeProjectsCount = await prisma.project.count({
    where: {
      company_id: companyId,
      status: { in: ["PLANNING", "ACTIVE", "ON_HOLD"] },
    },
  });

  const rawPlanId = sub?.plan || "BASIC";
  const planKey = resolvePlanKey(rawPlanId);
  const plan = COMMERCIAL_PLANS[planKey];

  const isDemo = !!sub?.is_demo;
  const isActive = !!sub && !sub.is_expired && (sub.status === SubscriptionStatus.ACTIVE || sub.status === SubscriptionStatus.TRIAL_ACTIVE || isDemo);
  const isExpired = !!sub && sub.is_expired;

  let daysRemaining = 0;
  const endDate = sub?.end_date || sub?.expires_at;
  if (isDemo) {
    daysRemaining = 9999;
  } else if (endDate) {
    daysRemaining = Math.max(0, Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  }

  const maxProjects = plan.maxActiveProjects === Infinity ? -1 : plan.maxActiveProjects;
  let canCreateProject = false;
  let canCreateProjectReason = "";

  if (!sub) {
    canCreateProject = false;
    canCreateProjectReason = "No active subscription. Please select a plan to start creating projects.";
  } else if (isExpired) {
    canCreateProject = false;
    canCreateProjectReason = "Your subscription has expired. Please renew your plan to create projects.";
  } else if (plan.maxActiveProjects !== Infinity && activeProjectsCount >= plan.maxActiveProjects) {
    canCreateProject = false;
    canCreateProjectReason = `Your current ${plan.name} allows ${plan.maxActiveProjects} active project${plan.maxActiveProjects === 1 ? "" : "s"}. Archive an existing project or upgrade your plan.`;
  } else {
    canCreateProject = true;
  }

  return {
    company_id: companyId,
    plan_id: plan.id,
    plan_name: plan.name,
    badge: plan.badge,
    setup_cost: plan.setupCost,
    monthly_price: plan.monthlyPrice,
    base_price: plan.basePrice,
    status: sub?.status || SubscriptionStatus.NONE,
    is_demo: isDemo,
    is_active: isActive,
    is_expired: isExpired,
    starts_at: sub?.start_date || sub?.starts_at || null,
    expires_at: endDate || null,
    days_remaining: daysRemaining,
    max_projects: maxProjects, // -1 means unlimited
    active_projects_count: activeProjectsCount,
    can_create_project: canCreateProject,
    can_create_project_reason: canCreateProjectReason,
    has_crm: isActive && plan.hasCRM,
    has_construction: isActive && plan.hasConstruction,
  };
}

/**
 * Checks whether a company is allowed to create a new active project.
 */
export async function canCreateProject(companyId: string | null | undefined): Promise<{
  allowed: boolean;
  reason?: string;
  currentActiveCount: number;
  maxProjects: number | "unlimited";
}> {
  if (!companyId) {
    return {
      allowed: false,
      reason: "No company context provided.",
      currentActiveCount: 0,
      maxProjects: 0,
    };
  }

  const entitlements = await getCompanyEntitlements(companyId);

  return {
    allowed: entitlements.can_create_project,
    reason: entitlements.can_create_project ? undefined : entitlements.can_create_project_reason,
    currentActiveCount: entitlements.active_projects_count,
    maxProjects: entitlements.max_projects === -1 ? "unlimited" : entitlements.max_projects,
  };
}

/**
 * Checks whether a company is allowed to access CRM features.
 * CRM is included in the Enterprise Plan.
 */
export async function canAccessCRM(companyId: string | null | undefined): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  if (!companyId) {
    return {
      allowed: false,
      reason: "No company context provided.",
    };
  }

  const entitlements = await getCompanyEntitlements(companyId);

  if (!entitlements.is_active) {
    return {
      allowed: false,
      reason: "Your subscription is not active or has expired. Please subscribe or renew to access CRM.",
    };
  }

  if (!entitlements.has_crm) {
    return {
      allowed: false,
      reason: "CRM is available exclusively on the Enterprise Plan. Upgrade your plan to manage leads, pipelines, and deals.",
    };
  }

  return { allowed: true };
}

/**
 * Returns project usage metrics for a company.
 */
export async function getProjectUsage(companyId: string | null | undefined) {
  if (!companyId) return { activeCount: 0, limit: 0, canCreate: false };
  const entitlements = await getCompanyEntitlements(companyId);
  return {
    activeCount: entitlements.active_projects_count,
    limit: entitlements.max_projects === -1 ? "Unlimited" : entitlements.max_projects,
    canCreate: entitlements.can_create_project,
    plan: entitlements.plan_name,
  };
}
