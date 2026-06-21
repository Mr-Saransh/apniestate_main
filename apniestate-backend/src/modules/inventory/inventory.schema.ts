import { z } from "zod";

export const CreateInventorySchema = z.object({
  material_id: z.string().min(1, "Material ID is required"),
  site_id: z.string().min(1, "Site ID is required"),
  quantity: z.number().nonnegative("Quantity cannot be negative").default(0),
  min_quantity: z.number().nonnegative("Min quantity cannot be negative").default(0),
});

export const UpdateInventorySchema = CreateInventorySchema.partial();
