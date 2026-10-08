import { z } from "zod";

export const CreateSubContractorSchema = z.object({
  name: z.string().min(2, "Full Name must be at least 2 characters").trim(),
  email: z.string().min(3, "Email / Login ID is required").trim(),
  password: z.string().min(4, "Password must be at least 4 characters"),
  project_id: z.string().min(1, "Project is required"),
  work_type: z.string().min(1, "Work Type is required").trim(),
  allocated_budget: z.coerce.number().min(0, "Allocated Budget must be greater than or equal to 0"),
  phone: z.string().optional().nullable().or(z.literal("")),
});

export type CreateSubContractorInput = z.infer<typeof CreateSubContractorSchema>;

export const AssignSubContractorSchema = z.object({
  user_id: z.string().min(1, "Sub Contractor user ID is required"),
  project_id: z.string().min(1, "Project is required"),
  work_type: z.string().min(1, "Work Type is required").trim(),
  allocated_budget: z.coerce.number().min(0, "Allocated Budget must be greater than or equal to 0"),
});

export type AssignSubContractorInput = z.infer<typeof AssignSubContractorSchema>;

export const CreateSubContractorExpenseSchema = z.object({
  assignment_id: z.string().min(1, "Assignment ID is required"),
  amount: z.number().positive("Expense amount must be greater than 0"),
  description: z.string().min(1, "Description is required"),
  bill_url: z.string().optional().nullable(),
  attachment_id: z.string().optional().nullable(),
});

export type CreateSubContractorExpenseInput = z.infer<typeof CreateSubContractorExpenseSchema>;

export const ReviewExpenseSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  rejection_reason: z.string().optional().nullable(),
});

export type ReviewExpenseInput = z.infer<typeof ReviewExpenseSchema>;

export const CreateSubContractorTaskSchema = z.object({
  assignment_id: z.string().min(1, "Assignment ID is required"),
  description: z.string().min(2, "Task description is required"),
  deadline: z.string().optional().nullable(),
});

export type CreateSubContractorTaskInput = z.infer<typeof CreateSubContractorTaskSchema>;

export const UpdateSubContractorTaskSchema = z.object({
  description: z.string().min(2).optional(),
  deadline: z.string().optional().nullable(),
  status: z.enum(["OPEN", "IN_PROGRESS", "COMPLETED_PENDING_APPROVAL"]).optional(),
});

export type UpdateSubContractorTaskInput = z.infer<typeof UpdateSubContractorTaskSchema>;

export const ReviewTaskSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
});

export type ReviewTaskInput = z.infer<typeof ReviewTaskSchema>;

export const UpdateSubContractorAssignmentSchema = z.object({
  allocated_budget: z.coerce.number().min(0).optional(),
  work_type: z.string().min(1).optional(),
});

export type UpdateSubContractorAssignmentInput = z.infer<typeof UpdateSubContractorAssignmentSchema>;

