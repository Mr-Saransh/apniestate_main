import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { generateWeeklyReport, getWeeklyReports } from "@/modules/dpr/dpr.service";
import { ok, created, badRequest } from "@/lib/response";

export const GET = withAuth(async (req, user) => {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("project_id") || undefined;
  const siteId = url.searchParams.get("site_id") || undefined;

  const items = await getWeeklyReports({ project_id: projectId, site_id: siteId, company_id: user.company_id || undefined });
  return ok(items);
});

export const POST = withAuth(async (req, user) => {
  const body = await req.json();
  const { project_id, site_id, start_date, end_date } = body;

  if (!project_id || !start_date || !end_date) {
    return badRequest("project_id, start_date, and end_date are required.");
  }

  try {
    const report = await generateWeeklyReport({ project_id, site_id, start_date, end_date }, user.sub, user.company_id || undefined);
    return created(report, "Weekly Progress Report generated successfully");
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: { message: error.message } }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
});
