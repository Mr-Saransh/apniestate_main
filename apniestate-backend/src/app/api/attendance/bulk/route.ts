import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok, created, badRequest } from "@/lib/response";
import { z } from "zod";
import { validateBody } from "@/middleware/validate.middleware";

const BulkAttendanceSchema = z.object({
  site_id: z.string().min(1, "Site is required"),
  date: z.string().min(1, "Date is required"),
  records: z.array(z.object({
    worker_id: z.string().min(1),
    status: z.enum(["PRESENT", "ABSENT", "HALF_DAY", "ON_LEAVE", "LATE"]),
    check_in: z.string().optional().nullable(),
    check_out: z.string().optional().nullable(),
    overtime_hours: z.number().nonnegative().optional(),
    shift: z.enum(["DAY", "NIGHT", "GENERAL"]).optional(),
    notes: z.string().optional().nullable(),
  })),
});

export const POST = withAuth(async (req, user) => {
  const parsed = await validateBody(req, BulkAttendanceSchema);
  if ("error" in parsed) return parsed.error;

  const { site_id, date, records } = parsed.data;
  const attendanceDate = new Date(date);

  const results = await prisma.$transaction(
    records.map(record =>
      prisma.workerAttendance.upsert({
        where: {
          worker_id_date: {
            worker_id: record.worker_id,
            date: attendanceDate,
          },
        },
        update: {
          status: record.status,
          site_id,
          shift: record.shift || "GENERAL",
          check_in: record.check_in ? new Date(record.check_in) : null,
          check_out: record.check_out ? new Date(record.check_out) : null,
          overtime_hours: record.overtime_hours || 0,
          is_half_day: record.status === "HALF_DAY",
          is_late: record.status === "LATE",
          notes: record.notes,
          marked_by: user.sub,
        },
        create: {
          worker_id: record.worker_id,
          date: attendanceDate,
          status: record.status,
          site_id,
          shift: record.shift || "GENERAL",
          check_in: record.check_in ? new Date(record.check_in) : null,
          check_out: record.check_out ? new Date(record.check_out) : null,
          overtime_hours: record.overtime_hours || 0,
          is_half_day: record.status === "HALF_DAY",
          is_late: record.status === "LATE",
          notes: record.notes,
          marked_by: user.sub,
        },
      })
    )
  );

  return created({ count: results.length }, `Attendance marked for ${results.length} workers`);
});
