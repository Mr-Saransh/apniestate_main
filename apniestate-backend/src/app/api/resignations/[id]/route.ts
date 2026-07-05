import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { ok, badRequest } from "@/lib/response";
import { reviewResignation } from "@/modules/resignations/resignations.service";

export const PATCH = withAuth(async (req, user, context) => {
  if (!user.company_id || user.role !== "BUILDER") return badRequest("Unauthorized");

  const { id } = context.params;
  const body = await req.json();
  const { status } = body;

  if (status !== "APPROVED" && status !== "REJECTED") {
    return badRequest("Status must be APPROVED or REJECTED");
  }

  try {
    await reviewResignation(id, user.company_id, user.sub, status);
    return ok(null, `Resignation ${status.toLowerCase()}`);
  } catch (error: any) {
    return badRequest(error.message || "Failed to review resignation");
  }
});
