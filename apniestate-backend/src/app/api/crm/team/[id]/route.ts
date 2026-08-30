import { NextRequest } from "next/server";
import { withCrmAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok, badRequest, forbidden, notFound, serverError } from "@/lib/response";
import { getCrmUserContext } from "@/modules/crm/crm-permissions";

// PATCH /api/crm/team/[id] — Suspend, activate, or remove CRM team member
export const PATCH = withCrmAuth(async (req, user, context) => {
  try {
    if (!user.company_id) return badRequest("No company context");

    const crmCtx = await getCrmUserContext(user);
    if (!crmCtx) {
      return forbidden("You do not have CRM permissions in this company.");
    }

    if (crmCtx.crmRole === "TELECALLER") {
      return forbidden("Telecallers cannot manage team members.");
    }

    const { id: targetUserId } = await context.params;
    const body = await req.json();
    const { action, reassignToUserId } = body;

    // Find target user's membership in this company
    const targetMembership = await prisma.companyMembership.findUnique({
      where: {
        user_id_company_id: {
          user_id: targetUserId,
          company_id: user.company_id,
        },
      },
    });

    if (!targetMembership) {
      return notFound("Team member not found in this company.");
    }

    const isTargetBuilder = targetMembership.roles.includes("BUILDER") || targetMembership.roles.includes("ADMIN");
    const isTargetManager = targetMembership.roles.includes("CRM_MANAGER");

    // Protection rules:
    // No one can suspend or remove the Builder
    if (isTargetBuilder) {
      return forbidden("Cannot modify builder/owner account.");
    }

    // CRM Manager cannot suspend or remove another CRM Manager
    if (crmCtx.crmRole === "CRM_MANAGER" && isTargetManager) {
      return forbidden("CRM Managers cannot modify another CRM Manager.");
    }

    // Handle optional lead reassignment before action
    if (reassignToUserId) {
      // Verify recipient belongs to this company and is active
      const recipient = await prisma.companyMembership.findUnique({
        where: {
          user_id_company_id: {
            user_id: reassignToUserId,
            company_id: user.company_id,
          },
        },
      });

      if (!recipient || recipient.status !== "ACTIVE") {
        return badRequest("Reassignment recipient must be an active team member.");
      }

      await prisma.crmLead.updateMany({
        where: {
          company_id: user.company_id,
          assigned_to: targetUserId,
        },
        data: {
          assigned_to: reassignToUserId,
        },
      });
    }

    if (action === "suspend") {
      await prisma.companyMembership.update({
        where: { id: targetMembership.id },
        data: { status: "INACTIVE" },
      });
      return ok(null, "Member suspended successfully");
    } else if (action === "activate") {
      await prisma.companyMembership.update({
        where: { id: targetMembership.id },
        data: { status: "ACTIVE" },
      });
      return ok(null, "Member activated successfully");
    } else if (action === "remove") {
      if (crmCtx.crmRole !== "BUILDER") {
        return forbidden("Only builders can completely remove team members.");
      }

      await prisma.companyMembership.delete({
        where: { id: targetMembership.id },
      });

      return ok(null, "Member removed from company successfully");
    } else {
      return badRequest("Invalid action. Must be suspend, activate, or remove.");
    }
  } catch (err: any) {
    console.error("CRM Team member update error:", err);
    return serverError(err.message);
  }
});
