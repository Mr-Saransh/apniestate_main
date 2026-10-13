import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { UpdateSubContractorAssignmentSchema } from "@/modules/subcontractors/subcontractors.schema";
import {
  updateSubContractorAssignment,
  deleteSubContractorAssignment,
} from "@/modules/subcontractors/subcontractors.service";
import { ok, forbidden, notFound, badRequest } from "@/lib/response";

export const PATCH = withAuth(async (req: NextRequest, user, context?: any) => {
  if (user.role !== "BUILDER" && user.role !== "ADMIN") {
    return forbidden("Only Builders and Admins can update assignments.");
  }

  const params = await context?.params;
  const assignmentId = params?.id;
  if (!assignmentId) return badRequest("Assignment ID is required");

  const parsed = await validateBody(req, UpdateSubContractorAssignmentSchema);
  if ("error" in parsed) return parsed.error;

  try {
    const updated = await updateSubContractorAssignment(
      assignmentId,
      parsed.data,
      user.sub,
      user.company_id || null
    );
    return ok(updated, "Assignment updated and budget synced successfully");
  } catch (error: any) {
    return badRequest(error.message || "Failed to update assignment");
  }
});

export const DELETE = withAuth(async (_req: NextRequest, user, context?: any) => {
  if (user.role !== "BUILDER" && user.role !== "ADMIN" && user.role !== "PROJECT_MANAGER") {
    return forbidden("Only Builders and Admins can delete assignments.");
  }

  const params = await context?.params;
  const assignmentId = params?.id;
  if (!assignmentId) return badRequest("Assignment ID is required");

  try {
    const result = await deleteSubContractorAssignment(
      assignmentId,
      user.sub,
      user.company_id || null
    );
    return ok(result, "Assignment removed and budget reverted successfully");
  } catch (error: any) {
    return badRequest(error.message || "Failed to delete assignment");
  }
});
