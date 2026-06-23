import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { CreateLeaveSchema } from "@/modules/leaves/leaves.schema";
import { getLeaves, createLeave } from "@/modules/leaves/leaves.service";
import { ok, created } from "@/lib/response";

export const GET = withAuth(async (req) => {
  const url = new URL(req.url);
  const filters = {
    worker_id: url.searchParams.get("worker_id") || undefined,
    status: url.searchParams.get("status") || undefined,
  };
  const leaves = await getLeaves(filters);
  return ok(leaves);
});

export const POST = withAuth(async (req) => {
  const parsed = await validateBody(req, CreateLeaveSchema);
  if ("error" in parsed) return parsed.error;
  const leave = await createLeave(parsed.data);
  return created(leave, "Leave request submitted");
});
