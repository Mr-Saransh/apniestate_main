import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { UpdateBudgetSchema } from "@/modules/budgets/budgets.schema";
import { getBudgetById, updateBudget, deleteBudget } from "@/modules/budgets/budgets.service";
import { ok, notFound, noContent } from "@/lib/response";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withAuth(async (_req: NextRequest, _user, ctx?: Ctx) => {
  const { id } = await ctx!.params;
  const budget = await getBudgetById(id);
  if (!budget) return notFound("Budget");
  return ok(budget);
});

export const PATCH = withAuth(async (req: NextRequest, _user, ctx?: Ctx) => {
  const { id } = await ctx!.params;
  const parsed = await validateBody(req, UpdateBudgetSchema);
  if ("error" in parsed) return parsed.error;
  const budget = await updateBudget(id, parsed.data);
  return ok(budget, "Budget updated");
});

export const DELETE = withAuth(async (_req: NextRequest, _user, ctx?: Ctx) => {
  const { id } = await ctx!.params;
  await deleteBudget(id);
  return noContent();
});
