import { z } from "zod";

export const CreateBOQItemSchema = z.object({
  code: z.string().optional().nullable(),
  description: z.string(),
  quantity: z.number().min(0),
  unit: z.string(),
  material_rate: z.number().min(0).default(0),
  labour_rate: z.number().min(0).default(0),
  equipment_rate: z.number().min(0).default(0),
  other_rate: z.number().min(0).default(0),
  remarks: z.string().optional().nullable(),
});

export const CreateBOQCategorySchema = z.object({
  name: z.string(),
  parent_id: z.string().optional().nullable(),
  items: z.array(CreateBOQItemSchema).optional(),
});

// Using a recursive schema for nested categories is possible but let's keep it flat for API if needed, 
// or recursive:
export const BOQCategoryTreeSchema: z.ZodType<any> = z.lazy(() => 
  z.object({
    name: z.string(),
    items: z.array(CreateBOQItemSchema).optional(),
    children: z.array(BOQCategoryTreeSchema).optional(),
  })
);

export const CreateBOQSchema = z.object({
  project_id: z.string(),
  notes: z.string().optional().nullable(),
  categories: z.array(BOQCategoryTreeSchema),
});
