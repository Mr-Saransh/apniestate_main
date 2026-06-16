import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { UpdateProjectSchema } from "@/modules/projects/projects.schema";
import { getProjectById, updateProject, deleteProject } from "@/modules/projects/projects.service";
import { ok, noContent, notFound } from "@/lib/response";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withAuth(async (_req, _user, ctx?: Ctx) => {
  const { id } = await ctx!.params;
  const project = await getProjectById(id);
  if (!project) return notFound("Project");
  return ok(project);
});

export const PATCH = withAuth(async (req, _user, ctx?: Ctx) => {
  const { id } = await ctx!.params;
  const parsed = await validateBody(req, UpdateProjectSchema);
  if ("error" in parsed) return parsed.error;
  const project = await updateProject(id, parsed.data);
  return ok(project, "Project updated");
});

export const DELETE = withAuth(async (_req, _user, ctx?: Ctx) => {
  const { id } = await ctx!.params;
  await deleteProject(id);
  return noContent();
});
