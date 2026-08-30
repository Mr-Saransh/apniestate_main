import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { CreateProjectSchema } from "@/modules/projects/projects.schema";
import { getProjects, createProject } from "@/modules/projects/projects.service";
import { canCreateProject } from "@/modules/subscription/entitlement.service";
import { ok, created, forbidden } from "@/lib/response";

export const GET = withAuth(async (_req, user) => {
  const projects = await getProjects(user.sub, user.role, user.company_id);
  return ok(projects);
});

export const POST = withAuth(async (req, user) => {
  const parsed = await validateBody(req, CreateProjectSchema);
  if ("error" in parsed) return parsed.error;

  // Backend Entitlement Enforcement: Active project limit check
  const entitlement = await canCreateProject(user.company_id);
  if (!entitlement.allowed) {
    return forbidden(
      entitlement.reason || "Your current subscription plan limit does not allow creating new projects."
    );
  }

  const project = await createProject(parsed.data, user.sub, user.company_id);
  return created(project, "Project created");
});
