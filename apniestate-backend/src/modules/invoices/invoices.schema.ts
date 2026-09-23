import { z } from "zod";

export const CreateInvoiceSchema = z.object({
  vendor_id: z.string().min(1, "Vendor is required"),
  project_id: z.string().optional().nullable(),
  site_id: z.string().optional().nullable(),
  number: z.string().optional(),
  amount: z.number().positive("Amount must be positive"),
  tax_amount: z.number().nonnegative().default(0),
  due_date: z.string().min(1, "Due date is required"),
  status: z.enum(["DRAFT", "PENDING", "APPROVED", "PAID", "OVERDUE", "CANCELLED", "SENT"]).default("DRAFT").optional(),
  notes: z.string().optional().nullable(),
});

export const UpdateInvoiceSchema = z.object({
  vendor_id: z.string().optional(),
  project_id: z.string().optional().nullable(),
  site_id: z.string().optional().nullable(),
  number: z.string().optional(),
  amount: z.number().positive().optional(),
  tax_amount: z.number().nonnegative().optional(),
  due_date: z.string().optional(),
  status: z.enum(["DRAFT", "PENDING", "APPROVED", "PAID", "OVERDUE", "CANCELLED", "SENT"]).optional(),
  notes: z.string().optional().nullable(),
});

