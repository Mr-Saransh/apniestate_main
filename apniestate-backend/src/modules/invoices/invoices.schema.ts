import { z } from "zod";

export const CreateInvoiceSchema = z.object({
  vendor_id: z.string().min(1, "Vendor is required"),
  amount: z.number().positive("Amount must be positive"),
  tax_amount: z.number().nonnegative().default(0),
  due_date: z.string().min(1, "Due date is required"),
  notes: z.string().optional().nullable(),
});

export const UpdateInvoiceSchema = z.object({
  amount: z.number().positive().optional(),
  tax_amount: z.number().nonnegative().optional(),
  due_date: z.string().optional(),
  status: z.enum(["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"]).optional(),
  notes: z.string().optional().nullable(),
});
