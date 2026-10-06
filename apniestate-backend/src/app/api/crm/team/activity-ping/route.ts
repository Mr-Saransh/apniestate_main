import { NextRequest } from "next/server";
import { withCrmAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok, badRequest, serverError } from "@/lib/response";

// POST /api/crm/team/activity-ping — Keeps member active session and records time spent
export const POST = withCrmAuth(async (req: NextRequest, user) => {
  try {
    if (!user.company_id) return badRequest("No company context");

    const now = new Date();

    // Update company membership last_active_at
    await prisma.companyMembership.updateMany({
      where: {
        user_id: user.sub,
        company_id: user.company_id,
      },
      data: {
        last_active_at: now,
      },
    });

    // Record heartbeat in ActivityLog (optional metadata for session calculation)
    await prisma.activityLog.create({
      data: {
        user_id: user.sub,
        company_id: user.company_id,
        entity_type: "CRM_SESSION",
        entity_id: user.sub,
        action: "HEARTBEAT",
        metadata: {
          timestamp: now.toISOString(),
        },
      },
    }).catch(() => {});

    return ok({ timestamp: now.toISOString() }, "Session active");
  } catch (err: any) {
    console.error("Activity ping error:", err);
    return serverError(err.message);
  }
});
