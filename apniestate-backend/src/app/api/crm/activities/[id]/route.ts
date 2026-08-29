import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok, badRequest, notFound, serverError } from "@/lib/response";

// PUT /api/crm/activities/[id]
export const PUT = withAuth(async (req, user, context) => {
  try {
    if (!user.company_id) return badRequest("No company context");
    const { id } = await context.params;
    const existing = await prisma.crmActivity.findFirst({
      where: { id, company_id: user.company_id },
    });
    if (!existing) return notFound("Activity");

    const body = await req.json();
    const activity = await prisma.crmActivity.update({
      where: { id },
      data: {
        title: body.title ?? existing.title,
        description: body.description !== undefined ? body.description : existing.description,
        type: body.type ?? existing.type,
        completed: body.completed !== undefined ? body.completed : existing.completed,
        completed_at: body.completed === true ? new Date() : body.completed === false ? null : existing.completed_at,
        due_at: body.due_at ? new Date(body.due_at) : existing.due_at,
        priority: body.priority ?? existing.priority,
      },
    });

    return ok(activity, "Activity updated");
  } catch (err: any) {
    console.error("CRM Activity PUT error:", err);
    return serverError(err.message);
  }
});

// DELETE /api/crm/activities/[id]
export const DELETE = withAuth(async (req, user, context) => {
  try {
    if (!user.company_id) return badRequest("No company context");
    const { id } = await context.params;
    const existing = await prisma.crmActivity.findFirst({
      where: { id, company_id: user.company_id },
    });
    if (!existing) return notFound("Activity");

    await prisma.crmActivity.delete({ where: { id } });
    return ok(null, "Activity deleted");
  } catch (err: any) {
    console.error("CRM Activity DELETE error:", err);
    return serverError(err.message);
  }
});
