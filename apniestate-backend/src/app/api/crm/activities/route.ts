import { NextRequest } from "next/server";
import { withCrmAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok, created, badRequest, forbidden, notFound, serverError } from "@/lib/response";
import { getCrmUserContext } from "@/modules/crm/crm-permissions";

// GET /api/crm/activities
export const GET = withCrmAuth(async (req, user) => {
  try {
    if (!user.company_id) return badRequest("No company context");

    const crmCtx = await getCrmUserContext(user);
    if (!crmCtx) {
      return forbidden("You do not have CRM permissions in this company.");
    }

    const url = new URL(req.url);
    const type = url.searchParams.get("type");
    const completed = url.searchParams.get("completed");

    const where: any = { company_id: user.company_id };
    if (type) where.type = type;
    if (completed === "true") where.completed = true;
    if (completed === "false") where.completed = false;

    // Telecaller scoping
    if (crmCtx.leadScope === "OWN") {
      where.OR = [
        { created_by: user.sub },
        { lead: { OR: [{ assigned_to: user.sub }, { created_by: user.sub }] } },
      ];
    }

    const activities = await prisma.crmActivity.findMany({
      where,
      orderBy: { created_at: "desc" },
      include: {
        lead: { select: { id: true, name: true, initials: true, avatar_color: true, assigned_to: true } },
        creator: { select: { id: true, name: true, email: true } },
      },
      take: 100,
    });

    return ok(activities);
  } catch (err: any) {
    console.error("CRM Activities GET error:", err);
    return serverError(err.message);
  }
});

// POST /api/crm/activities
export const POST = withCrmAuth(async (req, user) => {
  try {
    if (!user.company_id) return badRequest("No company context");

    const crmCtx = await getCrmUserContext(user);
    if (!crmCtx) {
      return forbidden("You do not have CRM permissions in this company.");
    }

    const body = await req.json();
    if (!body.title) return badRequest("Activity title is required");

    if (body.lead_id) {
      const lead = await prisma.crmLead.findFirst({
        where: { id: body.lead_id, company_id: user.company_id },
      });
      if (!lead) return notFound("Lead");

      if (crmCtx.leadScope === "OWN") {
        if (lead.assigned_to !== user.sub && lead.created_by !== user.sub) {
          return forbidden("You can only create activities for your own leads.");
        }
      }
    }

    const activity = await prisma.crmActivity.create({
      data: {
        company_id: user.company_id,
        lead_id: body.lead_id || null,
        project_id: body.project_id || null,
        created_by: user.sub,
        type: body.type || "TASK",
        title: body.title,
        description: body.description || null,
        due_at: body.due_at ? new Date(body.due_at) : null,
        priority: body.priority || "MEDIUM",
      },
      include: {
        lead: { select: { id: true, name: true, initials: true, avatar_color: true } },
      },
    });

    return created(activity, "Activity created");
  } catch (err: any) {
    console.error("CRM Activity POST error:", err);
    return serverError(err.message);
  }
});
