import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { CreateMilestoneSchema } from "@/modules/milestones/milestones.schema";
import { getMilestones, createMilestone } from "@/modules/milestones/milestones.service";
import { ok, created } from "@/lib/response";

export const GET = withAuth(async (req) => {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("project_id") || undefined;
  const milestones = await getMilestones(projectId);
  return ok(milestones);
});

export const POST = withAuth(async (req) => {
  const parsed = await validateBody(req, CreateMilestoneSchema);
  if ("error" in parsed) return parsed.error;
  const milestone = await createMilestone(parsed.data);
  return created(milestone, "Milestone created");
});
