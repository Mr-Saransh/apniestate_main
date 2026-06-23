import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { CreateWorkerTransferSchema } from "@/modules/workers/workers.schema";
import { getWorkerTransfers, createWorkerTransfer } from "@/modules/workers/workers.service";
import { ok, created } from "@/lib/response";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withAuth(async (_req: NextRequest, _user, ctx?: Ctx) => {
  const { id } = await ctx!.params;
  const transfers = await getWorkerTransfers(id);
  return ok(transfers);
});

export const POST = withAuth(async (req: NextRequest, _user, ctx?: Ctx) => {
  const { id } = await ctx!.params;
  const parsed = await validateBody(req, CreateWorkerTransferSchema);
  if ("error" in parsed) return parsed.error;
  const transfer = await createWorkerTransfer(id, parsed.data);
  return created(transfer, "Worker transferred");
});
