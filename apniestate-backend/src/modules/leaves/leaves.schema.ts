import { z } from "zod";

export const CreateLeaveSchema = z.object({
  worker_id: z.string().min(1, "Worker is required"),
  type: z.enum(["CASUAL", "SICK", "EARNED", "UNPAID", "EMERGENCY"]).default("CASUAL"),
  from_date: z.string().min(1, "From date is required"),
  to_date: z.string().min(1, "To date is required"),
  reason: z.string().optional().nullable(),
});

export const UpdateLeaveSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED"]),
});
