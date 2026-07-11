import { z } from "zod";

export const CreateMaterialRequestSchema = z.object({
  site_id: z.string().min(1, "Site is required"),
  material_id: z.string().min(1, "Material is required"),
  quantity: z.number().positive("Quantity must be positive"),
  notes: z.string().optional().nullable(),
  priority: z.enum(["URGENT", "HIGH", "NORMAL", "LOW"]).optional(),
});

export const UpdateMaterialRequestSchema = z.object({
  status: z.enum(["DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "ORDERED", "DELIVERED", "COMPLETED", "CANCELLED"]),
  notes: z.string().optional().nullable(),
  approved_quantity: z.number().positive("Quantity must be positive").optional().nullable(),
  assigned_vendor_id: z.string().optional().nullable(),
  expected_delivery_date: z.string().optional().nullable(),
});
