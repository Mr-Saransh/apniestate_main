import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { CreateProjectSchema } from "@/modules/projects/projects.schema";
import { getProjects, createProject } from "@/modules/projects/projects.service";
import { ok, created } from "@/lib/response";

export const GET = withAuth(async (_req, user) => {

  const projects = await getProjects(user.sub, user.role, user.company_id);
  return ok(projects);
});

export const POST = withAuth(async (req, user) => {
  const parsed = await validateBody(req, CreateProjectSchema);
  if ("error" in parsed) return parsed.error;

  const project = await createProject(parsed.data, user.sub, user.company_id);
  return created(project, "Project created");
});
