import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { UpdateProjectSchema } from "@/modules/projects/projects.schema";
import { getProjectById, updateProject, deleteProject } from "@/modules/projects/projects.service";
import { canCreateProject } from "@/modules/subscription/entitlement.service";
import { ok, noContent, notFound, forbidden } from "@/lib/response";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withAuth(async (_req, user, ctx?: Ctx) => {
  const { id } = await ctx!.params;
  const project = await getProjectById(id, user.company_id);
  if (!project) return notFound("Project");
  return ok(project);
});

export const PATCH = withAuth(async (req, user, ctx?: Ctx) => {
  const { id } = await ctx!.params;
  const parsed = await validateBody(req, UpdateProjectSchema);
  if ("error" in parsed) return parsed.error;

  // If reactivating a completed/cancelled project, check active project limits
  if (parsed.data.status && ["PLANNING", "ACTIVE", "ON_HOLD"].includes(parsed.data.status)) {
    const existing = await getProjectById(id, user.company_id);
    if (existing && ["COMPLETED", "CANCELLED"].includes(existing.status)) {
      const entitlement = await canCreateProject(user.company_id);
      if (!entitlement.allowed) {
        return forbidden(
          entitlement.reason || "Reactivating this project exceeds your current plan limit."
        );
      }
    }
  }

  const project = await updateProject(id, parsed.data, user.company_id);
  if (!project) return notFound("Project");
  return ok(project, "Project updated");
});

export const DELETE = withAuth(async (_req, user, ctx?: Ctx) => {
  const { id } = await ctx!.params;
  const success = await deleteProject(id, user.company_id);
  if (!success) return notFound("Project");
  return noContent();
});
