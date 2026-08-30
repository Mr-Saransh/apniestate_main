import { NextRequest } from "next/server";
import { withCrmAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok, badRequest, notFound, forbidden, serverError } from "@/lib/response";
import { getCrmUserContext } from "@/modules/crm/crm-permissions";

// GET /api/crm/leads/[id]
export const GET = withCrmAuth(async (req, user, context) => {
  try {
    if (!user.company_id) return badRequest("No company context");

    const crmCtx = await getCrmUserContext(user);
    if (!crmCtx) {
      return forbidden("You do not have CRM permissions in this company.");
    }

    const { id } = await context.params;
    const lead = await prisma.crmLead.findFirst({
      where: { id, company_id: user.company_id },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
        followups: { orderBy: { created_at: "desc" }, take: 20 },
        activities: { orderBy: { created_at: "desc" }, take: 20 },
        deals: { orderBy: { deal_date: "desc" } },
      },
    });

    if (!lead) return notFound("Lead");

    // Security check: Telecaller cannot view other agents' private leads
    if (crmCtx.leadScope === "OWN") {
      if (lead.assigned_to !== user.sub && lead.created_by !== user.sub) {
        return forbidden("You do not have access to view this lead.");
      }
    }

    return ok(lead);
  } catch (err: any) {
    console.error("CRM Lead GET error:", err);
    return serverError(err.message);
  }
});

// PUT /api/crm/leads/[id]
export const PUT = withCrmAuth(async (req, user, context) => {
  try {
    if (!user.company_id) return badRequest("No company context");

    const crmCtx = await getCrmUserContext(user);
    if (!crmCtx) {
      return forbidden("You do not have CRM permissions in this company.");
    }

    const { id } = await context.params;
    const existing = await prisma.crmLead.findFirst({
      where: { id, company_id: user.company_id },
    });

    if (!existing) return notFound("Lead");

    // Security check: Telecaller can only edit leads assigned to/created by them
    if (crmCtx.leadScope === "OWN") {
      if (existing.assigned_to !== user.sub && existing.created_by !== user.sub) {
        return forbidden("You do not have permission to edit this lead.");
      }
    }

    const body = await req.json();

    // Re-derive initials if name changed
    let initials = existing.initials;
    if (body.name && body.name !== existing.name) {
      initials = body.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
    }

    // Telecaller cannot reassign leads
    let assigned_to = existing.assigned_to;
    if (crmCtx.leadScope !== "OWN" && body.assigned_to !== undefined) {
      assigned_to = body.assigned_to;
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
        assigned_to,
        notes: body.notes !== undefined ? body.notes : existing.notes,
        project_id: body.project_id !== undefined ? body.project_id : existing.project_id,
        last_contacted_at: body.last_contacted_at ? new Date(body.last_contacted_at) : existing.last_contacted_at,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
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
export const DELETE = withCrmAuth(async (req, user, context) => {
  try {
    if (!user.company_id) return badRequest("No company context");

    const crmCtx = await getCrmUserContext(user);
    if (!crmCtx) {
      return forbidden("You do not have CRM permissions in this company.");
    }

    // Telecaller cannot delete leads
    if (!crmCtx.hasCapability("CRM_DELETE_LEAD")) {
      return forbidden("You do not have permission to delete leads.");
    }

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
