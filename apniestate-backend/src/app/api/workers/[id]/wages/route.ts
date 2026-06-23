import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { CreateWorkerWageSchema } from "@/modules/workers/workers.schema";
import { getWorkerWages, createWorkerWage } from "@/modules/workers/workers.service";
import { ok, created } from "@/lib/response";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withAuth(async (_req: NextRequest, _user, ctx?: Ctx) => {
  const { id } = await ctx!.params;
  const wages = await getWorkerWages(id);
  return ok(wages);
});

export const POST = withAuth(async (req: NextRequest, _user, ctx?: Ctx) => {
  const { id } = await ctx!.params;
  const parsed = await validateBody(req, CreateWorkerWageSchema);
  if ("error" in parsed) return parsed.error;
  const wage = await createWorkerWage(id, parsed.data);
  return created(wage, "Worker wage record created");
});
