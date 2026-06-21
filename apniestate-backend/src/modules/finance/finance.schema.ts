import { z } from "zod";

export const CreateFinanceSchema = z.object({
  amount: z.number().positive("Amount must be positive").or(z.string().transform(v => parseFloat(v))),
  category: z.string().min(2, "Category is required"),
  description: z.string().optional().nullable(),
  site_id: z.string().optional().nullable(),
  date: z.string().optional().nullable(),
  receipt_url: z.string().optional().nullable(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "PAID"]).optional(),
});

export const UpdateFinanceSchema = CreateFinanceSchema.partial();
