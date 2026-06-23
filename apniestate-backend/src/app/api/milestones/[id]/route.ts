import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { UpdateMilestoneSchema } from "@/modules/milestones/milestones.schema";
import { getMilestoneById, updateMilestone, deleteMilestone } from "@/modules/milestones/milestones.service";
import { ok, notFound, noContent } from "@/lib/response";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withAuth(async (_req: NextRequest, _user, ctx?: Ctx) => {
  const { id } = await ctx!.params;
  const milestone = await getMilestoneById(id);
  if (!milestone) return notFound("Milestone");
  return ok(milestone);
});

export const PATCH = withAuth(async (req: NextRequest, _user, ctx?: Ctx) => {
  const { id } = await ctx!.params;
  const parsed = await validateBody(req, UpdateMilestoneSchema);
  if ("error" in parsed) return parsed.error;
  const milestone = await updateMilestone(id, parsed.data);
  return ok(milestone, "Milestone updated");
});

export const DELETE = withAuth(async (_req: NextRequest, _user, ctx?: Ctx) => {
  const { id } = await ctx!.params;
  await deleteMilestone(id);
  return noContent();
});
