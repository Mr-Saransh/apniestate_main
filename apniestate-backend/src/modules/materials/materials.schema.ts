import { z } from "zod";

export const CreateMaterialSchema = z.object({
  name: z.string().min(2, "Material name is required"),
  unit: z.string().min(1, "Unit of measure is required (e.g. bags, tons)"),
  description: z.string().optional(),
  category: z.string().optional(),
});

export const UpdateMaterialSchema = CreateMaterialSchema.partial();
