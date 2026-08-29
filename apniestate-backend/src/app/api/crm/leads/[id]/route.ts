import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok, badRequest, notFound, serverError } from "@/lib/response";

// GET /api/crm/leads/[id]
export const GET = withAuth(async (req, user, context) => {
  try {
    if (!user.company_id) return badRequest("No company context");
    const { id } = await context.params;
    const lead = await prisma.crmLead.findFirst({
      where: { id, company_id: user.company_id },
      include: {
        assignee: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        followups: { orderBy: { created_at: "desc" }, take: 20 },
        activities: { orderBy: { created_at: "desc" }, take: 20 },
        deals: { orderBy: { deal_date: "desc" } },
      },
    });
    if (!lead) return notFound("Lead");
    return ok(lead);
  } catch (err: any) {
    console.error("CRM Lead GET error:", err);
    return serverError(err.message);
  }
});

// PUT /api/crm/leads/[id]
export const PUT = withAuth(async (req, user, context) => {
  try {
    if (!user.company_id) return badRequest("No company context");
    const { id } = await context.params;
    const existing = await prisma.crmLead.findFirst({
      where: { id, company_id: user.company_id },
    });
    if (!existing) return notFound("Lead");

    const body = await req.json();

    // Re-derive initials if name changed
    let initials = existing.initials;
    if (body.name && body.name !== existing.name) {
      initials = body.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
    }

    const lead = await prisma.crmLead.update({
      where: { id },
      data: {
        name: body.name ?? existing.name,
        initials,
        phone: body.phone !== undefined ? body.phone : existing.phone,
        email: body.email !== undefined ? body.email : existing.email,
        type: body.type ?? existing.type,
        status: body.status ?? existing.status,
        priority: body.priority ?? existing.priority,
        source: body.source !== undefined ? body.source : existing.source,
        budget: body.budget !== undefined ? body.budget : existing.budget,
        city: body.city !== undefined ? body.city : existing.city,
        tags: body.tags ?? existing.tags,
        assigned_to: body.assigned_to !== undefined ? body.assigned_to : existing.assigned_to,
        notes: body.notes !== undefined ? body.notes : existing.notes,
        project_id: body.project_id !== undefined ? body.project_id : existing.project_id,
        last_contacted_at: body.last_contacted_at ? new Date(body.last_contacted_at) : existing.last_contacted_at,
      },
    });

    // Auto-create followup activity on status change
    if (body.status && body.status !== existing.status) {
      await prisma.crmActivity.create({
        data: {
          company_id: user.company_id,
          lead_id: id,
          created_by: user.sub,
          type: "NOTE",
          title: `Status changed from ${existing.status} to ${body.status}`,
        },
      });
    }

    return ok(lead, "Lead updated");
  } catch (err: any) {
    console.error("CRM Lead PUT error:", err);
    return serverError(err.message);
  }
});

// DELETE /api/crm/leads/[id]
export const DELETE = withAuth(async (req, user, context) => {
  try {
    if (!user.company_id) return badRequest("No company context");
    const { id } = await context.params;
    const existing = await prisma.crmLead.findFirst({
      where: { id, company_id: user.company_id },
    });
    if (!existing) return notFound("Lead");

    await prisma.crmLead.delete({ where: { id } });
    return ok(null, "Lead deleted");
  } catch (err: any) {
    console.error("CRM Lead DELETE error:", err);
    return serverError(err.message);
  }
});
