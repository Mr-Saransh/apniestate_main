import { z } from "zod";

export const CreateAttendanceSchema = z.object({
  worker_id: z.string().min(1, "Worker ID is required"),
  status: z.enum(["PRESENT", "ABSENT", "UNMARKED"]),
  site_id: z.string().optional(),
});

export const UpdateAttendanceSchema = CreateAttendanceSchema.partial();
