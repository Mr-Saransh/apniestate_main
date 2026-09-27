import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { CreateBudgetSchema, PresetBudgetSchema } from "@/modules/budgets/budgets.schema";
import { getBudgets, createBudget, applyRecommendedPreset, getProjectBudgetSummary } from "@/modules/budgets/budgets.service";
import { ok, created } from "@/lib/response";

export const GET = withAuth(async (req) => {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("project_id") || undefined;
  const summary = url.searchParams.get("summary") === "true";

  if (summary && projectId) {
    const data = await getProjectBudgetSummary(projectId);
    return ok(data);
  }

  const budgets = await getBudgets(projectId);
  return ok(budgets);
});

export const POST = withAuth(async (req, user) => {
  const url = new URL(req.url);
  const isPreset = url.searchParams.get("preset") === "true";

  if (isPreset) {
    const parsed = await validateBody(req, PresetBudgetSchema);
    if ("error" in parsed) return parsed.error;
    const budgets = await applyRecommendedPreset(parsed.data.project_id, parsed.data.total_budget, user.sub);
    return ok(budgets, "Recommended project budget preset configured");
  }

  const parsed = await validateBody(req, CreateBudgetSchema);
  if ("error" in parsed) return parsed.error;
  const budget = await createBudget(parsed.data, user.sub);
  return created(budget, "Budget entry saved");
});

