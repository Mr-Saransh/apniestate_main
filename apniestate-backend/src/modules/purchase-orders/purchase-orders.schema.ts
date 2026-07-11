import { z } from "zod";
import { PurchaseOrderStatus } from "@prisma/client";

export const CreatePurchaseOrderItemSchema = z.object({
  material_id: z.string(),
  quantity: z.number().min(1),
  unit_price: z.number().min(0),
  gst_rate: z.number().min(0).default(0),
});

export const CreatePurchaseOrderSchema = z.object({
  vendor_id: z.string(),
  project_id: z.string().optional().nullable(),
  site_id: z.string().optional().nullable(),
  delivery_date: z.string().optional().nullable(),
  terms_conditions: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  items: z.array(CreatePurchaseOrderItemSchema).min(1, "At least one item is required"),
});

export const UpdatePurchaseOrderStatusSchema = z.object({
  status: z.nativeEnum(PurchaseOrderStatus),
});
