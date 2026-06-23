import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { getActivityLogs } from "@/modules/activity-logs/activity-logs.service";
import { ok } from "@/lib/response";

export const GET = withAuth(async (req) => {
  const url = new URL(req.url);
  const filters = {
    user_id: url.searchParams.get("user_id") || undefined,
    entity_type: url.searchParams.get("entity_type") || undefined,
    entity_id: url.searchParams.get("entity_id") || undefined,
    limit: url.searchParams.get("limit") ? parseInt(url.searchParams.get("limit")!) : undefined,
  };
  const logs = await getActivityLogs(filters);
  return ok(logs);
});
