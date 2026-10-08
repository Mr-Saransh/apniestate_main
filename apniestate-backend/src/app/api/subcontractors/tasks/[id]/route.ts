import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { UpdateSubContractorTaskSchema } from "@/modules/subcontractors/subcontractors.schema";
import { updateSubContractorTask } from "@/modules/subcontractors/subcontractors.service";
import { ok, forbidden, badRequest } from "@/lib/response";

export const PATCH = withAuth(async (req: NextRequest, user, context?: any) => {
  if (user.role !== "SUB_CONTRACTOR") {
    return forbidden("Only Sub Contractors can update their tasks.");
  }

  const params = await context?.params;
  const taskId = params?.id;
  if (!taskId) {
    return badRequest("Task ID is required");
  }

  const parsed = await validateBody(req, UpdateSubContractorTaskSchema);
  if ("error" in parsed) return parsed.error;

  try {
    const updated = await updateSubContractorTask(taskId, parsed.data, user.sub);
    return ok(updated, "Task updated successfully");
  } catch (error: any) {
    return badRequest(error.message || "Failed to update task");
  }
});
