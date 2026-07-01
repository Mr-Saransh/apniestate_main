import { NextRequest } from "next/server";
import { withAuth, withPermission } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { CreateFinanceSchema } from "@/modules/finance/finance.schema";
import { getExpenses, createExpense } from "@/modules/finance/finance.service";
import { ok, created } from "@/lib/response";

export const GET = withPermission("finance.read", async (req, user) => {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("project_id") || undefined;
  const siteId = url.searchParams.get("site_id") || undefined;
  const items = await getExpenses(user.sub, projectId, siteId);
  return ok(items);
});

export const POST = withPermission("finance.create", async (req, user) => {
  const parsed = await validateBody(req, CreateFinanceSchema);
  if ("error" in parsed) return parsed.error;
  const item = await createExpense(parsed.data, user.sub);
  return created(item, "Finance created");
});
