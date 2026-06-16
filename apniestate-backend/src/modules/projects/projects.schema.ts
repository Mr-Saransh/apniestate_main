import { z } from "zod";

export const CreateProjectSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  start_date: z.string().datetime(),
  end_date: z.string().datetime().optional(),
  status: z.enum(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]).optional(),
});

export const UpdateProjectSchema = CreateProjectSchema.partial();
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
