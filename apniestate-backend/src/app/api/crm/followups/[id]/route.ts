import { NextRequest } from "next/server";
import { withCrmAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok, badRequest, notFound, serverError } from "@/lib/response";

// PUT /api/crm/followups/[id] — mark complete or update
export const PUT = withCrmAuth(async (req, user, context) => {
  try {
    if (!user.company_id) return badRequest("No company context");
    const { id } = await context.params;
    const existing = await prisma.crmFollowup.findFirst({
      where: { id, company_id: user.company_id },
    });
    if (!existing) return notFound("Follow-up");

    const body = await req.json();
    const followup = await prisma.crmFollowup.update({
      where: { id },
      data: {
        status: body.status ?? existing.status,
        outcome: body.outcome !== undefined ? body.outcome : existing.outcome,
        note: body.note !== undefined ? body.note : existing.note,
        completed_at: body.status === "COMPLETED" ? new Date() : existing.completed_at,
        due_at: body.due_at ? new Date(body.due_at) : existing.due_at,
      },
    });

    // Update lead last_contacted_at when completing a followup
    if (body.status === "COMPLETED" && existing.lead_id) {
      await prisma.crmLead.update({
        where: { id: existing.lead_id },
        data: { last_contacted_at: new Date() },
      });
    }

    return ok(followup, "Follow-up updated");
  } catch (err: any) {
    console.error("CRM Followup PUT error:", err);
    return serverError(err.message);
  }
});

// DELETE /api/crm/followups/[id]
export const DELETE = withCrmAuth(async (req, user, context) => {
  try {
    if (!user.company_id) return badRequest("No company context");
    const { id } = await context.params;
    const existing = await prisma.crmFollowup.findFirst({
      where: { id, company_id: user.company_id },
    });
    if (!existing) return notFound("Follow-up");

    await prisma.crmFollowup.delete({ where: { id } });
    return ok(null, "Follow-up deleted");
  } catch (err: any) {
    console.error("CRM Followup DELETE error:", err);
    return serverError(err.message);
  }
});
