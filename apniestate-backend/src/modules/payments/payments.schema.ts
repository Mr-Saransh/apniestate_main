import { z } from "zod";

export const CreatePaymentSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  vendor_id: z.string().optional().nullable(),
  contractor_id: z.string().optional().nullable(),
  invoice_id: z.string().optional().nullable(),
  date: z.string().min(1, "Payment date is required"),
  method: z.enum(["CASH", "BANK_TRANSFER", "CHEQUE", "UPI", "OTHER"]).default("BANK_TRANSFER"),
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const UpdatePaymentSchema = z.object({
  status: z.enum(["PENDING", "PROCESSING", "COMPLETED", "FAILED"]).optional(),
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});
