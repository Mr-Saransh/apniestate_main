import { NextRequest } from "next/server";
import { withCrmAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok, badRequest, forbidden, notFound, serverError } from "@/lib/response";
import { getCrmUserContext } from "@/modules/crm/crm-permissions";

// GET /api/crm/team/[id]/activity — Member actions on leads & time tracking for Admin/Builder
export const GET = withCrmAuth(async (req: NextRequest, user, context) => {
  try {
    if (!user.company_id) return badRequest("No company context");

    const crmCtx = await getCrmUserContext(user);
    if (!crmCtx) {
      return forbidden("You do not have CRM permissions in this company.");
    }

    // Telecallers cannot inspect other team members' activity logs
    if (crmCtx.crmRole === "TELECALLER") {
      return forbidden("Telecallers cannot inspect team member activities.");
    }

    const { id: targetUserId } = await context.params;
    const cid = user.company_id;

    // Verify member exists in company
    const membership = await prisma.companyMembership.findFirst({
      where: {
        user_id: targetUserId,
        company_id: cid,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            created_at: true,
          },
        },
      },
    });

    if (!membership) {
      return notFound("Team member not found in this company.");
    }

    // 1. Fetch Lead Actions (CrmActivity) created by this member
    const activities = await prisma.crmActivity.findMany({
      where: {
        company_id: cid,
        created_by: targetUserId,
      },
      orderBy: { created_at: "desc" },
      take: 150,
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            phone: true,
            status: true,
            initials: true,
            avatar_color: true,
          },
        },
      },
    });

    // 2. Fetch Session & Auth Logs from ActivityLog
    const sessionLogs = await prisma.activityLog.findMany({
      where: {
        user_id: targetUserId,
        entity_type: "CRM_SESSION",
        company_id: cid,
      },
      orderBy: { created_at: "desc" },
      take: 200,
    });

    // Parse sessions (Login / Logout / Heartbeats)
    const logins = sessionLogs.filter((l) => l.action === "LOGIN");
    const logouts = sessionLogs.filter((l) => l.action === "LOGOUT");

    const lastLogin = logins.length > 0 ? logins[0].created_at : null;
    const lastLogout = logouts.length > 0 ? logouts[0].created_at : null;

    // Group sessions by login events or activity clusters
    const sessionsList: Array<{
      id: string;
      login_at: string;
      logout_at: string | null;
      duration_minutes: number;
      is_current: boolean;
    }> = [];

    let totalActiveMinutes = 0;

    for (let i = 0; i < Math.min(logins.length, 15); i++) {
      const login = logins[i];
      const loginTime = new Date(login.created_at).getTime();

      // Find corresponding logout after this login but before next login
      const nextLoginTime = i > 0 ? new Date(logins[i - 1].created_at).getTime() : Date.now();
      const correspondingLogout = logouts.find((lo) => {
        const loTime = new Date(lo.created_at).getTime();
        return loTime >= loginTime && loTime <= nextLoginTime;
      });

      // Find heartbeats or activities in this session window
      const sessionEvents = sessionLogs.filter((e) => {
        const eTime = new Date(e.created_at).getTime();
        return eTime >= loginTime && eTime <= nextLoginTime;
      });

      let endTime = correspondingLogout ? new Date(correspondingLogout.created_at).getTime() : null;
      let isCurrent = false;

      if (!endTime) {
        // If within last 30 minutes, consider actively ongoing
        const lastSessionEvent = sessionEvents.length > 0 ? new Date(sessionEvents[0].created_at).getTime() : loginTime;
        if (Date.now() - lastSessionEvent < 30 * 60 * 1000) {
          isCurrent = true;
          endTime = Date.now();
        } else {
          endTime = lastSessionEvent;
        }
      }

      const durationMs = Math.max(0, (endTime || loginTime) - loginTime);
      const durationMinutes = Math.min(12 * 60, Math.max(1, Math.round(durationMs / (60 * 1000))));
      totalActiveMinutes += durationMinutes;

      sessionsList.push({
        id: login.id,
        login_at: login.created_at.toISOString(),
        logout_at: correspondingLogout ? correspondingLogout.created_at.toISOString() : isCurrent ? null : new Date(endTime).toISOString(),
        duration_minutes: durationMinutes,
        is_current: isCurrent,
      });
    }

    // Fallback if no explicit session logs exist yet:
    // estimate time based on activities timestamps
    if (sessionsList.length === 0 && activities.length > 0) {
      const firstAct = activities[activities.length - 1].created_at;
      const lastAct = activities[0].created_at;
      const spanMinutes = Math.max(5, Math.round((new Date(lastAct).getTime() - new Date(firstAct).getTime()) / (60 * 1000)));
      totalActiveMinutes = Math.min(480, spanMinutes);
      sessionsList.push({
        id: 'est-session',
        login_at: firstAct.toISOString(),
        logout_at: lastAct.toISOString(),
        duration_minutes: totalActiveMinutes,
        is_current: Date.now() - new Date(lastAct).getTime() < 30 * 60 * 1000,
      });
    }

    // 3. Compute detailed action breakdown
    let callAttempts = 0;
    let whatsappMessages = 0;
    let statusChanges = 0;
    let notesAdded = 0;
    let siteVisits = 0;

    activities.forEach((act) => {
      const titleLower = (act.title || "").toLowerCase();
      if (act.type === "CALL" || titleLower.includes("call") || titleLower.includes("dial")) {
        callAttempts++;
      } else if (titleLower.includes("whatsapp")) {
        whatsappMessages++;
      } else if (titleLower.includes("status") || titleLower.includes("interested")) {
        statusChanges++;
      } else if (act.type === "SITE_VISIT") {
        siteVisits++;
      } else {
        notesAdded++;
      }
    });

    // 4. Assigned Leads & Pipeline distribution
    const [assignedLeads, statusCounts, followupsCount, completedFollowups] = await Promise.all([
      prisma.crmLead.count({ where: { company_id: cid, assigned_to: targetUserId } }),
      prisma.crmLead.groupBy({
        by: ["status"],
        where: { company_id: cid, assigned_to: targetUserId },
        _count: true,
      }),
      prisma.crmFollowup.count({
        where: {
          company_id: cid,
          OR: [{ created_by: targetUserId }, { lead: { assigned_to: targetUserId } }],
        },
      }),
      prisma.crmFollowup.count({
        where: {
          company_id: cid,
          status: "COMPLETED",
          OR: [{ created_by: targetUserId }, { lead: { assigned_to: targetUserId } }],
        },
      }),
    ]);

    const pipelineBreakdown: Record<string, number> = {
      NEW: 0,
      CONTACTED: 0,
      QUALIFIED: 0,
      SITE_VISIT: 0,
      NEGOTIATION: 0,
      BOOKED: 0,
      LOST: 0,
    };
    statusCounts.forEach((s) => {
      pipelineBreakdown[s.status] = s._count;
    });

    return ok({
      member: {
        id: membership.user.id,
        name: membership.user.name,
        email: membership.user.email,
        phone: membership.user.phone,
        role: membership.user.role,
        crm_roles: membership.roles,
        status: membership.status,
        last_active_at: membership.last_active_at || membership.updated_at,
        created_at: membership.created_at,
      },
      timeTracking: {
        totalActiveMinutes,
        totalActiveHours: (totalActiveMinutes / 60).toFixed(1),
        lastLoginAt: lastLogin ? lastLogin.toISOString() : null,
        lastLogoutAt: lastLogout ? lastLogout.toISOString() : null,
        isCurrentlyOnline: membership.last_active_at
          ? Date.now() - new Date(membership.last_active_at).getTime() < 10 * 60 * 1000
          : false,
        sessions: sessionsList,
      },
      actionSummary: {
        totalActions: activities.length,
        callAttempts,
        whatsappMessages,
        statusChanges,
        notesAdded,
        siteVisits,
        assignedLeads,
        pipelineBreakdown,
        followupsCount,
        completedFollowups,
      },
      activities: activities.map((a) => ({
        id: a.id,
        type: a.type,
        title: a.title,
        description: a.description,
        created_at: a.created_at.toISOString(),
        lead: a.lead
          ? {
              id: a.lead.id,
              name: a.lead.name,
              phone: a.lead.phone,
              status: a.lead.status,
              initials: a.lead.initials,
              avatar_color: a.lead.avatar_color,
            }
          : null,
      })),
    });
  } catch (err: any) {
    console.error("CRM Member Activity GET error:", err);
    return serverError(err.message);
  }
});
