import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { ok, badRequest } from "@/lib/response";
import { submitResignation, getCompanyResignations, getMyResignations } from "@/modules/resignations/resignations.service";

export const GET = withAuth(async (req, user) => {
  if (user.role === "BUILDER" && user.company_id) {
    const resignations = await getCompanyResignations(user.company_id);
    return ok(resignations);
  } else {
    const resignations = await getMyResignations(user.sub);
    return ok(resignations);
  }
});

export const POST = withAuth(async (req, user) => {
  if (!user.company_id) return badRequest("No active company");

  const body = await req.json();
  const { reason, last_working_day, feedback } = body;

  if (!reason) return badRequest("Reason is required");

  try {
    const resignation = await submitResignation({
      user_id: user.sub,
      company_id: user.company_id,
      reason,
      last_working_day,
      feedback
    });
    return ok(resignation, "Resignation submitted successfully");
  } catch (error: any) {
    return badRequest(error.message || "Failed to submit resignation");
  }
});
