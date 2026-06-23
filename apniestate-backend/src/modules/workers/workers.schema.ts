import { z } from "zod";

export const CreateWorkerSchema = z.object({
  name: z.string().min(2, "Worker name is required"),
  phone: z.string().optional().nullable(),
  trade: z.string().min(1, "Trade/skill is required"),
  daily_rate: z.number().positive("Daily rate must be positive").optional().nullable(),
  contractor_id: z.string().optional().nullable(),
  site_id: z.string().optional().nullable(),
  project_id: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE", "TERMINATED", "ON_LEAVE"]).optional(),
  address: z.string().optional().nullable(),
  aadhaar_number: z.string().optional().nullable(),
  bank_account: z.string().optional().nullable(),
  bank_ifsc: z.string().optional().nullable(),
  date_of_joining: z.string().datetime().optional().nullable(),
  labour_team_id: z.string().optional().nullable(),
});

export const UpdateWorkerSchema = CreateWorkerSchema.partial();

export const CreateWorkerDocumentSchema = z.object({
  type: z.string().min(1, "Document type is required"),
  name: z.string().min(1, "Document name is required"),
  file_url: z.string().url("Valid file URL is required"),
  expiry_date: z.string().datetime().optional().nullable(),
});

export const CreateWorkerWageSchema = z.object({
  period_start: z.string(), // date string
  period_end: z.string(),
  present_days: z.number().int().nonnegative(),
  overtime_hours: z.number().nonnegative().default(0),
  daily_rate: z.number().positive(),
  overtime_rate: z.number().nonnegative().optional().nullable(),
  deductions: z.number().nonnegative().default(0),
  notes: z.string().optional().nullable(),
});

export const CreateWorkerTransferSchema = z.object({
  to_site_id: z.string().min(1, "Destination site is required"),
  transfer_date: z.string(), // date string
  reason: z.string().optional().nullable(),
});

export const CreateWorkerEmergencyContactSchema = z.object({
  name: z.string().min(1, "Contact name is required"),
  phone: z.string().min(1, "Contact phone is required"),
  relationship: z.string().min(1, "Relationship is required"),
});
