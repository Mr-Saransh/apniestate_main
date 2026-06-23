import { z } from "zod";

export const CreateProjectSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional().nullable(),
  start_date: z.string(),
  end_date: z.string().optional().nullable(),
  status: z.enum(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]).optional(),
  budget: z.number().nullable().optional().or(z.string().transform(v => v ? parseFloat(v) : null)),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  manager_id: z.string().nullable().optional(),
});

export const UpdateProjectSchema = CreateProjectSchema.partial();
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
