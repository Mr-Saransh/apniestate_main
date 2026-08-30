import { NextRequest } from "next/server";
import { COMMERCIAL_PLANS } from "@/modules/subscription/entitlement.service";
import { ok } from "@/lib/response";

export const GET = async (_req: NextRequest) => {
  const plans = Object.values(COMMERCIAL_PLANS).map((p) => {
    const durationPricing = p.allowedDurations.map((duration) => ({
      duration_months: duration,
      total_price: p.basePrice * duration,
      monthly_equivalent: p.basePrice,
    }));

    return {
      id: p.id,
      name: p.name,
      badge: p.badge,
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
