import { z } from "zod";

export const CreateMaterialRequestSchema = z.object({
  site_id: z.string().min(1, "Site is required"),
  material_id: z.string().min(1, "Material is required"),
  quantity: z.number().positive("Quantity must be positive"),
  notes: z.string().optional().nullable(),
});

export const UpdateMaterialRequestSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "DELIVERED"]),
  notes: z.string().optional().nullable(),
});
