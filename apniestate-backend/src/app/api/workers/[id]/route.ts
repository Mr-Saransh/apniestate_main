import { NextRequest } from "next/server";
import { withPermission } from "@/middleware/permission.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { UpdateWorkerSchema } from "@/modules/workers/workers.schema";
import { getWorkerById, updateWorker, deleteWorker, getWorkerPerformance } from "@/modules/workers/workers.service";
import { ok, notFound, noContent } from "@/lib/response";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withPermission("workers", "read")(async (_req: NextRequest, _user, ctx?: Ctx) => {
  const { id } = await ctx!.params;
  const worker = await getWorkerById(id);
  if (!worker) return notFound("Worker");
  return ok(worker);
});

export const PATCH = withPermission("workers", "update")(async (req: NextRequest, _user, ctx?: Ctx) => {
  const { id } = await ctx!.params;
  const parsed = await validateBody(req, UpdateWorkerSchema);
  if ("error" in parsed) return parsed.error;
  const worker = await updateWorker(id, parsed.data);
  return ok(worker, "Worker updated");
});

export const DELETE = withPermission("workers", "delete")(async (_req: NextRequest, _user, ctx?: Ctx) => {
  const { id } = await ctx!.params;
  await deleteWorker(id);
  return noContent();
});

