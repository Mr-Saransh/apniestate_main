import { withAuth } from "@/middleware/auth.middleware";
import { getCostIntelligenceForProject } from "@/modules/cost-intelligence/cost-intelligence.service";
import { ok } from "@/lib/response";

export const GET = withAuth(async (req, user) => {
  const url = new URL(req.url);
  const project_id = url.searchParams.get("project_id");
  if (!project_id) return Response.json({ message: "project_id required" }, { status: 400 });
  
  const dashboard = await getCostIntelligenceForProject(project_id, user.company_id || undefined);
  return ok(dashboard);
});
