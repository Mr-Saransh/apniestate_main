import { z } from "zod";

export const CreateUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["ADMIN", "BUILDER", "SITE_SUPERVISOR", "ACCOUNTANT", "INVENTORY_MANAGER", "PROJECT_MANAGER"]).optional(),
  phone: z.string().optional(),
});

export const UpdateUserSchema = CreateUserSchema.partial().omit({ password: true });

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
