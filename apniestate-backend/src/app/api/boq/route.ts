import { withAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { CreateBOQSchema } from "@/modules/boq/boq.schema";
import { createBOQ, getBOQForProject } from "@/modules/boq/boq.service";
import { ok, created } from "@/lib/response";

export const GET = withAuth(async (req) => {
  const url = new URL(req.url);
  const project_id = url.searchParams.get("project_id");
  if (!project_id) return Response.json({ message: "project_id required" }, { status: 400 });
  
  const boq = await getBOQForProject(project_id);
  return ok(boq);
});

export const POST = withAuth(async (req, user) => {
  const parsed = await validateBody(req, CreateBOQSchema);
  if ("error" in parsed) return parsed.error;
  
  const boq = await createBOQ(parsed.data, user.sub);
  return created(boq, "BOQ Created successfully");
});
