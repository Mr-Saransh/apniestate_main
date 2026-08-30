import { z } from "zod";

const BaseUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().optional(),
  username: z.string().min(3).max(50).optional(),
  password: z.string().min(6),
  role: z.enum([
    "ADMIN",
    "BUILDER",
    "SITE_SUPERVISOR",
    "ACCOUNTANT",
    "INVENTORY_MANAGER",
    "PROJECT_MANAGER",
    "CRM_MANAGER",
    "TELECALLER",
    "SALES_EXECUTIVE",
    "WORKER",
  ]).optional(),
  crm_role: z.enum(["CRM_MANAGER", "TELECALLER", "SALES_EXECUTIVE", "NONE"]).optional().nullable(),
  phone: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  project_ids: z.array(z.string()).optional(),
});

export const CreateUserSchema = BaseUserSchema.refine((data) => data.email || data.username, {
  message: "Either email or username must be provided",
  path: ["email"],
});

export const UpdateUserSchema = BaseUserSchema.omit({ password: true, email: true }).partial();

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
