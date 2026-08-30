import { NextRequest } from "next/server";
import { withCrmAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok, badRequest, forbidden, serverError } from "@/lib/response";
import { getCrmUserContext } from "@/modules/crm/crm-permissions";

interface BulkActionBody {
  lead_ids: string[];
  action: "ASSIGN" | "UNASSIGN" | "STATUS_CHANGE" | "DELETE";
  assigned_to?: string | null;
  status?: string;
}

// POST /api/crm/leads/bulk — Bulk actions on selected leads
export const POST = withCrmAuth(async (req: NextRequest, user) => {
  try {
    if (!user.company_id) return badRequest("No company context");

    const crmCtx = await getCrmUserContext(user);
    if (!crmCtx) {
      return forbidden("You do not have CRM permissions in this company.");
    }

    const body: BulkActionBody = await req.json();
    if (!body.lead_ids || !Array.isArray(body.lead_ids) || body.lead_ids.length === 0) {
      return badRequest("lead_ids array is required");
    }

    const cid = user.company_id;

    if (body.action === "ASSIGN") {
      if (!crmCtx.hasCapability("CRM_REASSIGN_LEADS") && crmCtx.crmRole !== "BUILDER" && crmCtx.crmRole !== "CRM_MANAGER") {
        return forbidden("Only Builders and CRM Managers can reassign leads.");
      }

      if (!body.assigned_to) {
        return badRequest("assigned_to user ID is required for ASSIGN action");
      }

      const recipient = await prisma.user.findFirst({
        where: { id: body.assigned_to },
        select: { id: true, name: true },
      });
      if (!recipient) return badRequest("Recipient user not found");

      await prisma.crmLead.updateMany({
        where: { id: { in: body.lead_ids }, company_id: cid },
        data: { assigned_to: recipient.id },
      });

      return ok({
        success: true,
        count: body.lead_ids.length,
        message: `Assigned ${body.lead_ids.length} leads to ${recipient.name}`,
      });
    }

    if (body.action === "UNASSIGN") {
      if (!crmCtx.hasCapability("CRM_REASSIGN_LEADS") && crmCtx.crmRole !== "BUILDER" && crmCtx.crmRole !== "CRM_MANAGER") {
        return forbidden("Only Builders and CRM Managers can unassign leads.");
      }

      await prisma.crmLead.updateMany({
        where: { id: { in: body.lead_ids }, company_id: cid },
        data: { assigned_to: null },
      });

      return ok({
        success: true,
        count: body.lead_ids.length,
        message: `Moved ${body.lead_ids.length} leads to Unassigned Pool`,
      });
    }

    if (body.action === "STATUS_CHANGE") {
      if (!body.status) return badRequest("status is required for STATUS_CHANGE action");

      const whereClause: any = { id: { in: body.lead_ids }, company_id: cid };
      if (crmCtx.leadScope === "OWN") {
        whereClause.OR = [{ assigned_to: user.sub }, { created_by: user.sub }];
      }

      const res = await prisma.crmLead.updateMany({
        where: whereClause,
        data: { status: body.status as any },
      });

      return ok({
        success: true,
        count: res.count,
        message: `Updated status for ${res.count} leads to ${body.status}`,
      });
    }

    if (body.action === "DELETE") {
      if (!crmCtx.hasCapability("CRM_DELETE_LEAD")) {
        return forbidden("You do not have permission to bulk delete leads.");
      }

      const res = await prisma.crmLead.deleteMany({
        where: { id: { in: body.lead_ids }, company_id: cid },
      });

      return ok({
        success: true,
        count: res.count,
        message: `Deleted ${res.count} leads`,
      });
    }

    return badRequest("Invalid action specified");
  } catch (err: any) {
    console.error("Bulk lead action error:", err);
    return serverError(err.message);
  }
});
