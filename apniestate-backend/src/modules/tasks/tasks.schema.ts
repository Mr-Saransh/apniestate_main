import { z } from "zod";

export const CreateTaskSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  site_id: z.string().optional(),
  assignee_id: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE", "BLOCKED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  due_date: z.string().datetime().optional(),
});

export const UpdateTaskSchema = CreateTaskSchema.partial();
