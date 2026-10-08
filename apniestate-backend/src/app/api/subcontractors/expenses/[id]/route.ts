import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { ReviewExpenseSchema } from "@/modules/subcontractors/subcontractors.schema";
import { reviewExpense } from "@/modules/subcontractors/subcontractors.service";
import { ok, forbidden, badRequest } from "@/lib/response";

export const PATCH = withAuth(async (req: NextRequest, user, context?: any) => {
  if (user.role !== "BUILDER" && user.role !== "ADMIN") {
    return forbidden("Only Builders can approve or reject expenses.");
  }

  const params = await context?.params;
  const expenseId = params?.id;
  if (!expenseId) {
    return badRequest("Expense ID is required");
  }

  const parsed = await validateBody(req, ReviewExpenseSchema);
  if ("error" in parsed) return parsed.error;

  try {
    const updated = await reviewExpense(
      expenseId,
      parsed.data,
      user.sub,
      user.company_id || null
    );
    return ok(updated, `Expense ${parsed.data.status.toLowerCase()} successfully`);
  } catch (error: any) {
    return badRequest(error.message || "Failed to update expense status");
  }
});
