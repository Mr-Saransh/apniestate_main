import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { UpdateProjectSchema } from "@/modules/projects/projects.schema";
import { getProjectById, updateProject, deleteProject } from "@/modules/projects/projects.service";
import { ok, noContent, notFound } from "@/lib/response";

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
