import { z } from "zod";

export const CreateVendorSchema = z.object({
  name: z.string().min(2, "Vendor name is required"),
  contact_person: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email("Invalid email").optional().nullable().or(z.literal("")),
  address: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
});

export const UpdateVendorSchema = CreateVendorSchema.partial();
