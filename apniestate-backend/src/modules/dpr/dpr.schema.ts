import { z } from "zod";

export const CreateDprSchema = z.object({
  project_id: z.string().optional().nullable(),
  site_id: z.string().min(1, "Site is required"),
  date: z.string().optional().nullable(),
  
  // Basic Info
  summary: z.string().min(3, "Summary is required"),
  weather: z.string().optional().nullable(),
  temperature: z.number().optional().nullable(),
  start_time: z.string().optional().nullable(),
  end_time: z.string().optional().nullable(),
  
  // Progress
  work_completed: z.string().optional().nullable(),
  work_in_progress: z.string().optional().nullable(),
  tomorrow_plan: z.string().optional().nullable(),
  completion_percentage: z.number().min(0).max(100).optional().nullable(),
  reasons_for_delay: z.string().optional().nullable(),
  
  // Observations
  safety_observations: z.string().optional().nullable(),
  quality_observations: z.string().optional().nullable(),
  visitor_notes: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
  
  status: z.enum(["DRAFT", "SUBMITTED", "APPROVED"]).optional(),

  // Legacy/JSON
  workers_present: z.number().int().nonnegative().optional().nullable().or(z.string().transform(v => v ? parseInt(v) : null)),
  materials_consumed: z.any().optional().nullable(),
  issues_faced: z.any().optional().nullable(),
  photos: z.any().optional().nullable(),
});

export const UpdateDprSchema = CreateDprSchema.partial();

export type CreateDprInput = z.infer<typeof CreateDprSchema>;
export type UpdateDprInput = z.infer<typeof UpdateDprSchema>;
