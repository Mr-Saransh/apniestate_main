import { z } from "zod";

export const CreateContractorSchema = z.object({
  name: z.string().min(2, "Contractor name is required"),
  company: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email("Invalid email").optional().nullable().or(z.literal("")),
  trade: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  gst_number: z.string().optional().nullable(),
  pan_number: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
});

export const UpdateContractorSchema = CreateContractorSchema.partial();
