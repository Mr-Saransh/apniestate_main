import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { UpdateFinanceSchema } from "@/modules/finance/finance.schema";
import { updateFinance, deleteFinance } from "@/modules/finance/finance.service";
import { ok } from "@/lib/response";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = withAuth(async (req: NextRequest, _user: any, context?: Ctx) => {
  const { id } = await context!.params;
  const parsed = await validateBody(req, UpdateFinanceSchema);
  if ("error" in parsed) return parsed.error;
  const item = await updateFinance(id, parsed.data);
  return ok(item, "Finance updated");
});

export const DELETE = withAuth(async (_req: NextRequest, _user: any, context?: Ctx) => {
  const { id } = await context!.params;
  await deleteFinance(id);
  return ok(null, "Finance deleted");
});
