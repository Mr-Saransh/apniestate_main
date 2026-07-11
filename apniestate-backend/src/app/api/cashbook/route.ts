import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { getCashbook, createCashbookEntry } from "@/modules/cashbook/cashbook.service";
import { ok, created } from "@/lib/response";

export const GET = withAuth(async (req, user) => {
  const url = new URL(req.url);
  const startDate = url.searchParams.get("start_date") || undefined;
  const endDate = url.searchParams.get("end_date") || undefined;
  const siteId = url.searchParams.get("site_id") || undefined;
  const projectId = url.searchParams.get("project_id") || undefined;
  
  const data = await getCashbook(startDate, endDate, siteId, projectId);
  return ok(data);
});

export const POST = withAuth(async (req, user) => {
  const body = await req.json();
  const entry = await createCashbookEntry(body, user.sub);
  return created(entry, "Cashbook entry created");
});
