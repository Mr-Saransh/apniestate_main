import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { CreateBudgetSchema } from "@/modules/budgets/budgets.schema";
import { getBudgets, createBudget } from "@/modules/budgets/budgets.service";
import { ok, created } from "@/lib/response";

export const GET = withAuth(async (req) => {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("project_id") || undefined;
  const budgets = await getBudgets(projectId);
  return ok(budgets);
});

export const POST = withAuth(async (req, user) => {
  const parsed = await validateBody(req, CreateBudgetSchema);
  if ("error" in parsed) return parsed.error;
  const budget = await createBudget(parsed.data, user.sub);
  return created(budget, "Budget entry created");
});
