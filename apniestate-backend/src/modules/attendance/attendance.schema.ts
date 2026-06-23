import { z } from "zod";

export const CreateAttendanceSchema = z.object({
  worker_id: z.string().min(1, "Worker ID is required"),
  status: z.enum(["PRESENT", "ABSENT", "HALF_DAY", "ON_LEAVE", "LATE", "UNMARKED"]),
  site_id: z.string().optional().nullable(),
  date: z.string().optional().nullable(),
  shift: z.enum(["DAY", "NIGHT", "GENERAL"]).optional().nullable(),
  check_in: z.string().optional().nullable(),
  check_out: z.string().optional().nullable(),
  overtime_hours: z.number().nonnegative().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const UpdateAttendanceSchema = CreateAttendanceSchema.partial();
