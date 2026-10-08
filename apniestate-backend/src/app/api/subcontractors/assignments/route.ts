import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { AssignSubContractorSchema } from "@/modules/subcontractors/subcontractors.schema";
import { assignSubContractor } from "@/modules/subcontractors/subcontractors.service";
import { created, forbidden, badRequest } from "@/lib/response";

export const POST = withAuth(async (req: NextRequest, user) => {
  if (user.role !== "BUILDER" && user.role !== "ADMIN") {
    return forbidden("Only Builders can assign sub contractors.");
  }

  const parsed = await validateBody(req, AssignSubContractorSchema);
  if ("error" in parsed) return parsed.error;

  try {
    const assignment = await assignSubContractor(parsed.data, user.sub, user.company_id || null);
    return created(assignment, "Sub Contractor assigned to project successfully");
  } catch (error: any) {
    return badRequest(error.message || "Failed to assign sub contractor");
  }
});
