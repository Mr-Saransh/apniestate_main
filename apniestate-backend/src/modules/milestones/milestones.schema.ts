import { z } from "zod";

export const CreateMilestoneSchema = z.object({
  project_id: z.string().min(1, "Project is required"),
  name: z.string().min(2, "Milestone name is required"),
  description: z.string().optional().nullable(),
  target_date: z.string().min(1, "Target date is required"),
  weight: z.number().int().positive().default(1),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "DELAYED"]).optional(),
});

export const UpdateMilestoneSchema = CreateMilestoneSchema.partial().omit({ project_id: true });
