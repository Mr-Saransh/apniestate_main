import { z } from "zod";

export const CreateInventorySchema = z.object({
  material_id: z.string().min(1, "Material ID is required"),
  site_id: z.string().min(1, "Site ID is required"),
  quantity: z.number().nonnegative("Quantity cannot be negative").default(0),
  min_quantity: z.number().nonnegative("Min quantity cannot be negative").default(0),
});

export const UpdateInventorySchema = CreateInventorySchema.partial();

export const CreateInventoryTransactionSchema = z.object({
  material_id: z.string().min(1, "Material is required"),
  site_id: z.string().min(1, "Site is required"),
  type: z.enum(["IN", "OUT", "ADJUST"]),
  quantity: z.number().positive("Quantity must be positive"),
  notes: z.string().optional().nullable(),
});
