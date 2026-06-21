import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { CreateFinanceSchema } from "@/modules/finance/finance.schema";
import { getFinances, createFinance } from "@/modules/finance/finance.service";
import { ok, created } from "@/lib/response";

export const GET = withAuth(async (_req, user) => {
  const items = await getFinances(user.sub);
  return ok(items);
});

export const POST = withAuth(async (req, user) => {
  const parsed = await validateBody(req, CreateFinanceSchema);
  if ("error" in parsed) return parsed.error;
  const item = await createFinance(parsed.data, user.sub);
  return created(item, "Finance created");
});
