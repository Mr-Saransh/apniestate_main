import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { ReviewTaskSchema } from "@/modules/subcontractors/subcontractors.schema";
import { reviewSubContractorTask } from "@/modules/subcontractors/subcontractors.service";
import { ok, forbidden, badRequest } from "@/lib/response";

export const PATCH = withAuth(async (req: NextRequest, user, context?: any) => {
  if (user.role !== "BUILDER" && user.role !== "ADMIN") {
    return forbidden("Only Builders can approve or reject tasks.");
  }

  const params = await context?.params;
  const taskId = params?.id;
  if (!taskId) {
    return badRequest("Task ID is required");
  }

  const parsed = await validateBody(req, ReviewTaskSchema);
  if ("error" in parsed) return parsed.error;

  try {
    const updated = await reviewSubContractorTask(taskId, parsed.data.action, user.sub);
    return ok(
      updated,
      `Task ${parsed.data.action === "APPROVE" ? "approved" : "returned/rejected"} successfully`
    );
  } catch (error: any) {
    return badRequest(error.message || "Failed to review task");
  }
});
