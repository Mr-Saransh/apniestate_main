import { z } from "zod";

export const CreateDprSchema = z.object({
  site_id: z.string().min(1, "Site is required"),
  date: z.string().optional().nullable(),
  work_completed: z.string().min(3, "Work completed detail is required"),
  weather: z.string().optional().nullable(),
  workers_present: z.number().int().nonnegative().optional().nullable().or(z.string().transform(v => v ? parseInt(v) : null)),
  materials_consumed: z.string().optional().nullable(),
  issues_faced: z.string().optional().nullable(),
  photos: z.any().optional().nullable(),
  tomorrow_plan: z.string().optional().nullable(),
});

export type CreateDprInput = z.infer<typeof CreateDprSchema>;
