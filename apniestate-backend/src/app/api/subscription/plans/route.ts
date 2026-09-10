import { NextRequest } from "next/server";
import {
  COMMERCIAL_PLANS,
  calculateSubscriptionBreakdown,
  type CommercialPlanId,
} from "@/modules/subscription/entitlement.service";
import { ok } from "@/lib/response";

const CANONICAL_PLANS: CommercialPlanId[] = ["BASIC", "PROFESSIONAL", "ENTERPRISE"];

export const GET = async (_req: NextRequest) => {
  const plans = CANONICAL_PLANS.map((planId) => {
    const p = COMMERCIAL_PLANS[planId];
    const durationPricing = p.allowedDurations.map((duration) => {
      const initialBreakdown = calculateSubscriptionBreakdown(p.id, duration, { isRenewal: false });
      const renewalBreakdown = calculateSubscriptionBreakdown(p.id, duration, { isRenewal: true });

      return {
        duration_months: duration,
        discount_percentage: initialBreakdown.discountPercentage,
        discount_amount: initialBreakdown.discountAmount,
        gross_subscription_price: initialBreakdown.grossSubscriptionPrice,
        subscription_price: initialBreakdown.subscriptionPrice,
        setup_cost: p.setupCost,
        total_initial_price: initialBreakdown.totalPrice,
        total_renewal_price: renewalBreakdown.totalPrice,
        total_price: initialBreakdown.totalPrice,
        monthly_equivalent: p.monthlyPrice,
      };
    });

    return {
      id: p.id,
      name: p.name,
      badge: p.badge,
      setup_cost: p.setupCost,
      monthly_price: p.monthlyPrice,
      base_price: p.basePrice,
      max_active_projects: p.maxActiveProjects === Infinity ? "Unlimited" : p.maxActiveProjects,
      has_crm: p.hasCRM,
      has_construction: p.hasConstruction,
      allowed_durations: p.allowedDurations,
      description: p.description,
      features: p.features,
      pricing_matrix: durationPricing,
    };
  });

  return ok(plans, "Commercial subscription plans retrieved");
};
