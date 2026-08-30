import { NextRequest } from "next/server";
import { withCrmAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok, badRequest, forbidden, serverError } from "@/lib/response";
import { getCrmUserContext } from "@/modules/crm/crm-permissions";

// Fast in-memory cache for CRM analytics (5 seconds TTL per user context)
const analyticsCache = new Map<string, { data: any; expiry: number }>();

// GET /api/crm/analytics — computed CRM dashboard stats tailored to CRM role
export const GET = withCrmAuth(async (req, user) => {
  try {
    if (!user.company_id) return badRequest("No company context");

    const crmCtx = await getCrmUserContext(user);
    if (!crmCtx) {
      return forbidden("You do not have CRM permissions in this company.");
    }

    const cid = user.company_id;
    const cacheKey = `${cid}_${user.sub}_${crmCtx.crmRole}`;
    const now = Date.now();
    const cached = analyticsCache.get(cacheKey);
    if (cached && cached.expiry > now) {
      return ok(cached.data);
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    let result: any;

    if (crmCtx.crmRole === "TELECALLER") {
      // ─── Telecaller Personal Analytics ───────────────────────
      const leadFilter = {
        company_id: cid,
        OR: [{ assigned_to: user.sub }, { created_by: user.sub }],
      };

      const [
        myLeads,
        statusCounts,
        myBookings,
        todayFollowups,
        overdueFollowups,
        mySiteVisits,
        recentLeads,
        todayFollowupList,
      ] = await Promise.all([
        prisma.crmLead.count({ where: leadFilter }),
        prisma.crmLead.groupBy({ by: ["status"], where: leadFilter, _count: true }),
        prisma.crmDeal.count({
          where: {
            company_id: cid,
            OR: [{ created_by: user.sub }, { lead: leadFilter }],
          },
        }),
        prisma.crmFollowup.count({
          where: {
            company_id: cid,
            status: "PENDING",
            due_at: { gte: todayStart, lt: todayEnd },
            lead: leadFilter,
          },
        }),
        prisma.crmFollowup.count({
          where: {
            company_id: cid,
            status: "PENDING",
            due_at: { lt: todayStart },
            lead: leadFilter,
          },
        }),
        prisma.crmActivity.count({
          where: {
            company_id: cid,
            type: "SITE_VISIT",
            lead: leadFilter,
          },
        }),
        prisma.crmLead.findMany({
          where: leadFilter,
          orderBy: { created_at: "desc" },
          take: 5,
          select: {
            id: true,
            name: true,
            initials: true,
            avatar_color: true,
            phone: true,
            status: true,
            budget: true,
            city: true,
            created_at: true,
          },
        }),
        prisma.crmFollowup.findMany({
          where: {
            company_id: cid,
            status: "PENDING",
            due_at: { gte: todayStart, lt: todayEnd },
            lead: leadFilter,
          },
          orderBy: { due_at: "asc" },
          take: 5,
          include: {
            lead: { select: { id: true, name: true, phone: true, avatar_color: true, initials: true } },
          },
        }),
      ]);

      const pipeline: Record<string, number> = {
        NEW: 0, CONTACTED: 0, QUALIFIED: 0, SITE_VISIT: 0, NEGOTIATION: 0, BOOKED: 0, LOST: 0,
      };
      statusCounts.forEach((s: any) => {
        pipeline[s.status] = s._count;
      });

      const conversionRate = myLeads > 0 ? Math.round(((pipeline.BOOKED || 0) / myLeads) * 100) : 0;

      result = {
        crmRole: "TELECALLER",
        myLeads,
        todayFollowups,
        overdueFollowups,
        mySiteVisits,
        myBookings,
        conversionRate,
        pipeline: Object.entries(pipeline).map(([stage, count]) => ({ stage, count })),
        recentLeads,
        todayFollowupList,
      };

    } else {
      // ─── CRM Manager & Builder Analytics ─────────────────────
      const [
        totalLeads,
        statusCounts,
        totalDeals,
        dealAggregates,
        pendingFollowups,
        overdueFollowups,
        todayFollowups,
        pendingActivities,
        unassignedLeads,
        sourceCounts,
        rawMemberships,
        allDeals,
        recentActivityLogs,
      ] = await Promise.all([
        prisma.crmLead.count({ where: { company_id: cid } }),
        prisma.crmLead.groupBy({ by: ["status"], where: { company_id: cid }, _count: true }),
        prisma.crmDeal.count({ where: { company_id: cid } }),
        prisma.crmDeal.aggregate({
          where: { company_id: cid },
          _sum: { deal_value: true, commission: true, amount_received: true },
        }),
        prisma.crmFollowup.count({ where: { company_id: cid, status: "PENDING" } }),
        prisma.crmFollowup.count({
          where: { company_id: cid, status: "PENDING", due_at: { lt: todayStart } },
        }),
        prisma.crmFollowup.count({
          where: {
            company_id: cid,
            status: "PENDING",
            due_at: { gte: todayStart, lt: todayEnd },
          },
        }),
        prisma.crmActivity.count({ where: { company_id: cid, completed: false } }),
        prisma.crmLead.count({ where: { company_id: cid, assigned_to: null } }),
        prisma.crmLead.groupBy({ by: ["source"], where: { company_id: cid }, _count: true }),
        prisma.companyMembership.findMany({
          where: {
            company_id: cid,
            status: "ACTIVE",
          },
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
          },
        }),
        prisma.crmDeal.findMany({
          where: { company_id: cid },
          select: { created_by: true, deal_value: true },
        }),
        prisma.crmActivity.findMany({
          where: { company_id: cid },
          orderBy: { created_at: "desc" },
          take: 8,
          include: {
            creator: { select: { id: true, name: true } },
            lead: { select: { id: true, name: true } },
          },
        }),
      ]);

      const teamMemberships = rawMemberships.filter((m: any) =>
        m.roles.some((r: any) => ["BUILDER", "CRM_MANAGER", "TELECALLER", "SALES_EXECUTIVE"].includes(r))
      );

      // Pipeline breakdown
      const pipeline: Record<string, number> = {
        NEW: 0, CONTACTED: 0, QUALIFIED: 0, SITE_VISIT: 0, NEGOTIATION: 0, BOOKED: 0, LOST: 0,
      };
      statusCounts.forEach((s: any) => {
        pipeline[s.status] = s._count;
      });

      const activeLeads = totalLeads - (pipeline.LOST || 0) - (pipeline.BOOKED || 0);
      const conversionRate = totalLeads > 0 ? Math.round(((pipeline.BOOKED || 0) / totalLeads) * 100) : 0;

      // Sources
      const sourceColors: Record<string, string> = {
        Direct: "#2648E7", Referral: "#8B5CF6", Website: "#3B82F6", WhatsApp: "#25D366",
        "Walk-in": "#F59E0B", Import: "#6B7280", "Social Media": "#EC4899",
      };
      const sources = sourceCounts.map((s: any) => ({
        name: s.source || "Unknown",
        value: s._count,
        color: sourceColors[s.source || "Direct"] || "#6B7280",
      }));

      // Team Performance Metrics
      const leadsPerUser = await prisma.crmLead.groupBy({
        by: ["assigned_to"],
        where: { company_id: cid, assigned_to: { not: null } },
        _count: true,
      });
      const leadMap = new Map<string, number>();
      leadsPerUser.forEach((l: any) => {
        if (l.assigned_to) leadMap.set(l.assigned_to, l._count);
      });

      const bookedLeadsPerUser = await prisma.crmLead.groupBy({
        by: ["assigned_to"],
        where: { company_id: cid, status: "BOOKED", assigned_to: { not: null } },
        _count: true,
      });
      const bookedMap = new Map<string, number>();
      bookedLeadsPerUser.forEach((b: any) => {
        if (b.assigned_to) bookedMap.set(b.assigned_to, b._count);
      });

      const teamPerformance = teamMemberships
        .filter((m) => m.roles.some((r) => ["TELECALLER", "SALES_EXECUTIVE", "CRM_MANAGER"].includes(r)))
        .map((m) => {
          const assignedCount = leadMap.get(m.user.id) || 0;
          const bookedCount = bookedMap.get(m.user.id) || 0;
          const convRate = assignedCount > 0 ? Math.round((bookedCount / assignedCount) * 100) : 0;
          let roleName = "Telecaller";
          if (m.roles.includes("CRM_MANAGER")) roleName = "CRM Manager";
          else if (m.roles.includes("BUILDER")) roleName = "Builder";

          return {
            userId: m.user.id,
            name: m.user.name,
            email: m.user.email,
            phone: m.user.phone,
            role: roleName,
            assignedLeads: assignedCount,
            bookedLeads: bookedCount,
            conversionRate: convRate,
          };
        })
        .sort((a, b) => b.bookedLeads - a.bookedLeads);

      const totalCustomers = await prisma.crmLead.count({
        where: { company_id: cid, status: { in: ["BOOKED", "NEGOTIATION"] } },
      });

      result = {
        crmRole: crmCtx.crmRole,
        totalLeads,
        activeLeads,
        totalCustomers,
        totalDeals,
        conversionRate,
        totalRevenue: dealAggregates._sum.deal_value || 0,
        totalCommission: dealAggregates._sum.commission || 0,
        totalReceived: dealAggregates._sum.amount_received || 0,
        pendingFollowups,
        overdueFollowups,
        todayFollowups,
        pendingActivities,
        unassignedLeads,
        crmTeamCount: teamMemberships.length,
        pipeline: Object.entries(pipeline).map(([stage, count]) => ({ stage, count })),
        sources,
        teamPerformance,
        recentActivityLogs,
      };
    }

    // Cache for 5 seconds
    analyticsCache.set(cacheKey, { data: result, expiry: now + 5000 });

    return ok(result);
  } catch (err: any) {
    console.error("CRM Analytics error:", err);
    return serverError(err.message);
  }
});
