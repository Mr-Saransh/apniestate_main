import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { getSubContractorAssignmentById } from "@/modules/subcontractors/subcontractors.service";
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
