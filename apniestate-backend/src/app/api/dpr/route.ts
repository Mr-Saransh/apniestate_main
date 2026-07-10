import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { CreateDprSchema } from "@/modules/dpr/dpr.schema";
import { getDprs, createDpr } from "@/modules/dpr/dpr.service";
import { ok, created } from "@/lib/response";

export const GET = withAuth(async (req, user) => {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("project_id") || undefined;
  const siteId = url.searchParams.get("site_id") || undefined;
  const date = url.searchParams.get("date") || undefined;

  const items = await getDprs({ project_id: projectId, site_id: siteId, date, company_id: user.company_id || undefined });
  return ok(items);
});

export const POST = withAuth(async (req, user) => {
  const parsed = await validateBody(req, CreateDprSchema);
  if ("error" in parsed) return parsed.error;

  try {
    const report = await createDpr(parsed.data, user.sub, user.company_id || undefined);
    return created(report, "DPR submitted successfully");
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: { message: error.message } }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
});
