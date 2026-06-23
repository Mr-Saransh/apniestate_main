import { z } from "zod";

export const CreateBudgetSchema = z.object({
  project_id: z.string().min(1, "Project is required"),
  category: z.enum(["MATERIALS", "LABOUR", "EQUIPMENT", "OVERHEAD", "SUBCONTRACT", "CONTINGENCY", "OTHER"]).default("OTHER"),
  allocated: z.number().nonnegative("Allocated amount must be non-negative"),
  spent: z.number().nonnegative().default(0),
  description: z.string().optional().nullable(),
});

export const UpdateBudgetSchema = CreateBudgetSchema.partial().omit({ project_id: true });
