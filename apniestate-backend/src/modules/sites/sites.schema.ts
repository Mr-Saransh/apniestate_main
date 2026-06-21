import { z } from "zod";

export const CreateSiteSchema = z.object({
  project_id: z.string().min(1, "Project is required"),
  name: z.string().min(2, "Site name must be at least 2 characters"),
  location: z.string().min(2, "Location is required"),
  supervisor_id: z.string().optional().nullable(),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "ON_HOLD", "COMPLETED"]).optional(),
  progress_percentage: z.number().int().min(0).max(100).optional(),
  phase: z.string().optional().nullable(),
});

export const UpdateSiteSchema = CreateSiteSchema.partial();
