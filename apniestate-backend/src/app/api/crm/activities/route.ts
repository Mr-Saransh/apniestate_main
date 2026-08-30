import { NextRequest } from "next/server";
import { withCrmAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok, created, badRequest, serverError } from "@/lib/response";

// GET /api/crm/activities
export const GET = withCrmAuth(async (req, user) => {
  try {
    if (!user.company_id) return badRequest("No company context");
    const url = new URL(req.url);
    const type = url.searchParams.get("type");
    const completed = url.searchParams.get("completed");

    const where: any = { company_id: user.company_id };
    if (type) where.type = type;
    if (completed === "true") where.completed = true;
    if (completed === "false") where.completed = false;

    const activities = await prisma.crmActivity.findMany({
      where,
      orderBy: { created_at: "desc" },
      include: {
        lead: { select: { id: true, name: true, initials: true, avatar_color: true } },
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
    const body = await req.json();
    if (!body.title) return badRequest("Activity title is required");

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
    });

    return created(activity, "Activity created");
  } catch (err: any) {
    console.error("CRM Activity POST error:", err);
    return serverError(err.message);
  }
});
