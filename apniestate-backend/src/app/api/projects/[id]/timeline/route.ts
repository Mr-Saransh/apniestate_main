import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { getProjectPlanningData } from "@/modules/projects/timeline-engine.service";
import { ok, notFound } from "@/lib/response";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withAuth(async (_req, _user, ctx?: Ctx) => {
  const { id } = await ctx!.params;
  const data = await getProjectPlanningData(id);
  if (!data) return notFound("Project");
  return ok(data);
});
