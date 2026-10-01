import { z } from "zod";

export const CreateMilestoneSchema = z.object({
  project_id: z.string().min(1, "Project is required"),
  name: z.string().min(2, "Milestone name is required"),
  description: z.string().optional().nullable(),
  target_date: z.string().optional(),
  planned_start_date: z.string().optional().nullable(),
  planned_end_date: z.string().optional().nullable(),
  plannedStartDate: z.string().optional().nullable(),
  plannedEndDate: z.string().optional().nullable(),
  actual_start_date: z.string().optional().nullable(),
  actual_end_date: z.string().optional().nullable(),
  actualStartDate: z.string().optional().nullable(),
  actualEndDate: z.string().optional().nullable(),
  weight: z.number().int().positive().default(1),
  progress_percentage: z.number().min(0).max(100).optional(),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "DELAYED"]).optional(),
}).refine(data => data.target_date || data.planned_end_date || data.plannedEndDate, {
  message: "Planned end date or target date is required",
  path: ["planned_end_date"]
});

export const UpdateMilestoneSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  target_date: z.string().optional(),
  planned_start_date: z.string().optional().nullable(),
  planned_end_date: z.string().optional().nullable(),
  plannedStartDate: z.string().optional().nullable(),
  plannedEndDate: z.string().optional().nullable(),
  actual_start_date: z.string().optional().nullable(),
  actual_end_date: z.string().optional().nullable(),
  actualStartDate: z.string().optional().nullable(),
  actualEndDate: z.string().optional().nullable(),
  weight: z.number().int().positive().optional(),
  progress_percentage: z.number().min(0).max(100).optional(),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "DELAYED"]).optional(),
});
