import { NextRequest } from "next/server";
import { withPermission } from "@/middleware/permission.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { CreateWorkerSchema } from "@/modules/workers/workers.schema";
import { getWorkers, createWorker } from "@/modules/workers/workers.service";
import { ok, created } from "@/lib/response";

export const GET = withPermission("workers", "read")(async (req, user) => {
  const url = new URL(req.url);
  const filters = {
    site_id: url.searchParams.get("site_id") || undefined,
    project_id: url.searchParams.get("project_id") || undefined,
    contractor_id: url.searchParams.get("contractor_id") || undefined,
    status: url.searchParams.get("status") || undefined,
    trade: url.searchParams.get("trade") || undefined,
  };
  const workers = await getWorkers(filters, user.company_id);
  return ok(workers);
});

export const POST = withPermission("workers", "create")(async (req, user) => {
  const parsed = await validateBody(req, CreateWorkerSchema);
  if ("error" in parsed) return parsed.error;
  const worker = await createWorker(parsed.data, user.company_id);
  return created(worker, "Worker created");
});

