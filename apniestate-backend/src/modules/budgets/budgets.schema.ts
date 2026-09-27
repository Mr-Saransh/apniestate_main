import { z } from "zod";

export const BudgetCategoryEnum = z.enum([
  "MATERIALS",
  "LABOUR",
  "EQUIPMENT",
  "OVERHEAD",
  "SUBCONTRACT",
  "CONTINGENCY",
  "MATERIAL",
  "GENERAL",
  "STOCK_TRANSFER",
  "SUBCONTRACTS",
  "BROKER",
  "OFFICE",
  "OTHER"
]);

export const CreateBudgetSchema = z.object({
  project_id: z.string().min(1, "Project is required"),
  category: BudgetCategoryEnum.default("OTHER"),
  allocated: z.number().nonnegative("Allocated amount must be non-negative"),
  spent: z.number().nonnegative().default(0),
  description: z.string().optional().nullable(),
});

export const UpdateBudgetSchema = CreateBudgetSchema.partial().omit({ project_id: true });

export const PresetBudgetSchema = z.object({
  project_id: z.string().min(1, "Project is required"),
  total_budget: z.number().positive("Total budget must be greater than zero"),
});

