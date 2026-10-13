import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import {
  getSubContractorAssignmentById,
  deleteSubContractorAssignment,
} from "@/modules/subcontractors/subcontractors.service";
import { ok, forbidden, notFound, badRequest } from "@/lib/response";

export const GET = withAuth(async (_req: NextRequest, user, context?: any) => {
  const params = await context?.params;
  const assignmentId = params?.id;

  if (!assignmentId) {
    return badRequest("Assignment ID is required");
  }

  try {
    const detail = await getSubContractorAssignmentById(assignmentId, user.sub, user.role);
    return ok(detail);
  } catch (error: any) {
    if (error.message?.includes("Access denied")) {
      return forbidden(error.message);
    }
    return notFound(error.message || "Sub Contractor assignment not found");
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

