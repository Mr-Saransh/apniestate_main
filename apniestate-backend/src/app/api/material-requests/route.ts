import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { CreateMaterialRequestSchema } from "./schema";
import { getMaterialRequests, createMaterialRequest } from "./service";
import { ok, created } from "@/lib/response";

export const GET = withAuth(async (req) => {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("project_id") || undefined;
  const filters = {
    project_id: projectId,
    site_id: url.searchParams.get("site_id") || undefined,
    status: url.searchParams.get("status") || undefined,
  };
  const requests = await getMaterialRequests(filters);
  return ok(requests);
});

export const POST = withAuth(async (req, user) => {
  const parsed = await validateBody(req, CreateMaterialRequestSchema);
  if ("error" in parsed) return parsed.error;
  const request = await createMaterialRequest(parsed.data, user.sub);
  return created(request, "Material request submitted");
});
