import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { UpdateAttendanceSchema } from "@/modules/attendance/attendance.schema";
import { updateAttendance, deleteAttendance } from "@/modules/attendance/attendance.service";
import { ok } from "@/lib/response";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = withAuth(async (req: NextRequest, _user: any, context?: Ctx) => {
  const { id } = await context!.params;
  const parsed = await validateBody(req, UpdateAttendanceSchema);
  if ("error" in parsed) return parsed.error;
  const item = await updateAttendance(id, parsed.data);
  return ok(item, "Attendance updated");
});

export const DELETE = withAuth(async (_req: NextRequest, _user: any, context?: Ctx) => {
  const { id } = await context!.params;
  await deleteAttendance(id);
  return ok(null, "Attendance deleted");
});
