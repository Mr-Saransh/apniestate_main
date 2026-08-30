import { NextRequest } from "next/server";
import { withCrmAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok, created, badRequest, forbidden, notFound, serverError } from "@/lib/response";
import { getCrmUserContext } from "@/modules/crm/crm-permissions";

// GET /api/crm/followups
export const GET = withCrmAuth(async (req, user) => {
  try {
    if (!user.company_id) return badRequest("No company context");

    const crmCtx = await getCrmUserContext(user);
    if (!crmCtx) {
      return forbidden("You do not have CRM permissions in this company.");
    }

    const url = new URL(req.url);
    const filter = url.searchParams.get("filter"); // today, overdue, upcoming, completed

    const where: any = { company_id: user.company_id };

    // Ownership scoping for Telecallers
    if (crmCtx.leadScope === "OWN") {
      where.lead = {
        OR: [
          { assigned_to: user.sub },
          { created_by: user.sub },
        ],
      };
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 86400000);

    if (filter === "today") {
      where.status = "PENDING";
      where.due_at = { gte: todayStart, lt: todayEnd };
    } else if (filter === "overdue") {
      where.status = "PENDING";
      where.due_at = { lt: todayStart };
    } else if (filter === "upcoming") {
      where.status = "PENDING";
      where.due_at = { gte: todayEnd };
    } else if (filter === "completed") {
      where.status = "COMPLETED";
    }

    const followups = await prisma.crmFollowup.findMany({
      where,
      orderBy: { due_at: filter === "completed" ? "desc" : "asc" },
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            initials: true,
            avatar_color: true,
            phone: true,
            status: true,
            assigned_to: true,
          },
        },
        creator: { select: { id: true, name: true, email: true } },
      },
    });

    return ok(followups);
  } catch (err: any) {
    console.error("CRM Followups GET error:", err);
    return serverError(err.message);
  }
});

// POST /api/crm/followups
export const POST = withCrmAuth(async (req, user) => {
  try {
    if (!user.company_id) return badRequest("No company context");

    const crmCtx = await getCrmUserContext(user);
    if (!crmCtx) {
      return forbidden("You do not have CRM permissions in this company.");
    }

    const body = await req.json();
    if (!body.lead_id) return badRequest("lead_id is required");
    if (!body.due_at) return badRequest("due_at is required");

    // Check lead exists and belongs to this company
    const lead = await prisma.crmLead.findFirst({
      where: { id: body.lead_id, company_id: user.company_id },
    });
    if (!lead) return notFound("Lead");

    // Security check for Telecallers
    if (crmCtx.leadScope === "OWN") {
      if (lead.assigned_to !== user.sub && lead.created_by !== user.sub) {
        return forbidden("You can only schedule follow-ups for your own leads.");
      }
    }

    const followup = await prisma.crmFollowup.create({
      data: {
        company_id: user.company_id,
        lead_id: body.lead_id,
        created_by: user.sub,
        note: body.note || null,
        due_at: new Date(body.due_at),
      },
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            initials: true,
            avatar_color: true,
            phone: true,
            status: true,
            assigned_to: true,
          },
        },
      },
    });

    return created(followup, "Follow-up scheduled");
  } catch (err: any) {
    console.error("CRM Followup POST error:", err);
    return serverError(err.message);
  }
});
