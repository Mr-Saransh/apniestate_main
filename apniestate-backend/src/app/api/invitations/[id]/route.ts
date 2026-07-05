import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { ok, badRequest } from "@/lib/response";
import { acceptInvitation, rejectInvitation, approveInvitation, cancelInvitation, resendInvitation } from "@/modules/invitations/invitations.service";

export const PATCH = withAuth(async (req, user, context) => {
  const { id } = context.params;
  const body = await req.json();
  const { action } = body;

  try {
    switch (action) {
      case "accept":
        await acceptInvitation(id, user.sub, user.email);
        return ok(null, "Invitation accepted");
        
      case "reject":
        await rejectInvitation(id, user.email);
        return ok(null, "Invitation rejected");
        
      case "approve":
        if (!user.company_id || user.role !== "BUILDER") return badRequest("Unauthorized");
        await approveInvitation(id, user.company_id);
        return ok(null, "Invitation approved");
        
      case "cancel":
        if (!user.company_id || user.role !== "BUILDER") return badRequest("Unauthorized");
        await cancelInvitation(id, user.company_id);
        return ok(null, "Invitation cancelled");
        
      case "resend":
        if (!user.company_id || user.role !== "BUILDER") return badRequest("Unauthorized");
        await resendInvitation(id, user.company_id);
        return ok(null, "Invitation resent");
        
      default:
        return badRequest("Invalid action");
    }
  } catch (error: any) {
    return badRequest(error.message || "Action failed");
  }
});
