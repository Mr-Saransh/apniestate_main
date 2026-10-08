import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { getMySubContractorAssignments } from "@/modules/subcontractors/subcontractors.service";
import { ok, forbidden, badRequest } from "@/lib/response";

export const GET = withAuth(async (_req: NextRequest, user) => {
  if (user.role !== "SUB_CONTRACTOR") {
    return forbidden("Only Sub Contractors can access their portal overview.");
  }

  try {
    const assignments = await getMySubContractorAssignments(user.sub);
    return ok(assignments);
  } catch (error: any) {
    return badRequest(error.message || "Failed to fetch sub contractor data");
  }
});
