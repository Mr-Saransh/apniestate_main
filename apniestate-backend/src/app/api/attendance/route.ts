import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { CreateAttendanceSchema } from "@/modules/attendance/attendance.schema";
import { getAttendances, createAttendance } from "@/modules/attendance/attendance.service";
import { ok, created } from "@/lib/response";

export const GET = withAuth(async (req, user) => {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("project_id");
  if (!projectId) return Response.json({ message: "project_id is required" }, { status: 400 });

  const date = url.searchParams.get("date") || undefined;
  const siteId = url.searchParams.get("site_id") || undefined;
  const items = await getAttendances(user.sub, projectId, date, siteId);
  return ok(items);
});

export const POST = withAuth(async (req, user) => {
  const parsed = await validateBody(req, CreateAttendanceSchema);
  if ("error" in parsed) return parsed.error;
  const item = await createAttendance(parsed.data, user.sub);
  return created(item, "Attendance created");
});
