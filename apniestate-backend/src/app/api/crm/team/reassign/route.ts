import { NextRequest } from "next/server";
import { withCrmAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok, badRequest, forbidden, serverError } from "@/lib/response";
import { getCrmUserContext } from "@/modules/crm/crm-permissions";

// POST /api/crm/team/reassign — Bulk reassign leads
export const POST = withCrmAuth(async (req, user) => {
  try {
    if (!user.company_id) return badRequest("No company context");

    const crmCtx = await getCrmUserContext(user);
    if (!crmCtx) {
      return forbidden("You do not have CRM permissions in this company.");
    }

    if (!crmCtx.hasCapability("CRM_REASSIGN_LEADS")) {
      return forbidden("You do not have permission to reassign leads.");
    }

    const body = await req.json();
    const { from_user_id, to_user_id, lead_ids, unassigned_only } = body;

    if (!to_user_id) {
      return badRequest("Destination user (to_user_id) is required.");
    }

    // Verify destination user is an active member of this company
    const recipient = await prisma.companyMembership.findUnique({
      where: {
        user_id_company_id: {
          user_id: to_user_id,
          company_id: user.company_id,
        },
      },
    });

    if (!recipient || recipient.status !== "ACTIVE") {
      return badRequest("Destination user must be an active member of this company.");
    }

    const where: any = { company_id: user.company_id };

    if (Array.isArray(lead_ids) && lead_ids.length > 0) {
      where.id = { in: lead_ids };
    } else if (unassigned_only) {
      where.assigned_to = null;
    } else if (from_user_id) {
      where.assigned_to = from_user_id;
    } else {
      return badRequest("Specify lead_ids, from_user_id, or unassigned_only.");
    }

    const result = await prisma.crmLead.updateMany({
      where,
      data: {
        assigned_to: to_user_id,
      },
    });

    return ok({ updatedCount: result.count }, `${result.count} lead(s) reassigned successfully`);
  } catch (err: any) {
    console.error("CRM Reassign Leads error:", err);
    return serverError(err.message);
  }
});
