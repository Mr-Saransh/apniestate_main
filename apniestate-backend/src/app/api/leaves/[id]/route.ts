import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { UpdateLeaveSchema } from "@/modules/leaves/leaves.schema";
import { getLeaveById, updateLeaveStatus, deleteLeave } from "@/modules/leaves/leaves.service";
import { ok, notFound, noContent } from "@/lib/response";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withAuth(async (_req: NextRequest, _user, ctx?: Ctx) => {
  const { id } = await ctx!.params;
  const leave = await getLeaveById(id);
  if (!leave) return notFound("Leave");
  return ok(leave);
});

export const PATCH = withAuth(async (req: NextRequest, user, ctx?: Ctx) => {
  const { id } = await ctx!.params;
  const parsed = await validateBody(req, UpdateLeaveSchema);
  if ("error" in parsed) return parsed.error;
  const leave = await updateLeaveStatus(id, parsed.data, user.sub);
  return ok(leave, "Leave status updated");
});

export const DELETE = withAuth(async (_req: NextRequest, _user, ctx?: Ctx) => {
  const { id } = await ctx!.params;
  await deleteLeave(id);
  return noContent();
});
