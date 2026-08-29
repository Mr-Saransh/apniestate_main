import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok, badRequest, serverError } from "@/lib/response";

// Fast in-memory cache for CRM analytics (10 seconds TTL per company)
const analyticsCache = new Map<string, { data: any; expiry: number }>();

// GET /api/crm/analytics — computed CRM dashboard stats with fast caching
export const GET = withAuth(async (req, user) => {
  try {
    if (!user.company_id) return badRequest("No company context");
    const cid = user.company_id;

    // Check cache
    const now = Date.now();
    const cached = analyticsCache.get(cid);
    if (cached && cached.expiry > now) {
      return ok(cached.data);
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [
      totalLeads,
      statusCounts,
      totalDeals,
      dealAggregates,
      pendingFollowups,
      overdueFollowups,
      todayFollowups,
      pendingActivities,
      sourceCounts,
    ] = await Promise.all([
      prisma.crmLead.count({ where: { company_id: cid } }),
      prisma.crmLead.groupBy({ by: ["status"], where: { company_id: cid }, _count: true }),
      prisma.crmDeal.count({ where: { company_id: cid } }),
      prisma.crmDeal.aggregate({
        where: { company_id: cid },
        _sum: { deal_value: true, commission: true, amount_received: true }
      }),
      prisma.crmFollowup.count({ where: { company_id: cid, status: "PENDING" } }),
      prisma.crmFollowup.count({
        where: { company_id: cid, status: "PENDING", due_at: { lt: todayStart } }
      }),
      prisma.crmFollowup.count({
        where: {
          company_id: cid,
          status: "PENDING",
          due_at: { gte: todayStart, lt: todayEnd },
        },
      }),
      prisma.crmActivity.count({ where: { company_id: cid, completed: false } }),
      prisma.crmLead.groupBy({ by: ["source"], where: { company_id: cid }, _count: true }),
    ]);

    // Pipeline breakdown
    const pipeline: Record<string, number> = {
      NEW: 0, CONTACTED: 0, QUALIFIED: 0, SITE_VISIT: 0, NEGOTIATION: 0, BOOKED: 0, LOST: 0,
    };
    statusCounts.forEach((s: any) => {
      pipeline[s.status] = s._count;
    });

    const activeLeads = totalLeads - (pipeline.LOST || 0) - (pipeline.BOOKED || 0);
    const conversionRate = totalLeads > 0 ? Math.round((pipeline.BOOKED / totalLeads) * 100) : 0;

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

    const result = {
      totalLeads,
      activeLeads,
      totalDeals,
      conversionRate,
      totalRevenue: dealAggregates._sum.deal_value || 0,
      totalCommission: dealAggregates._sum.commission || 0,
      totalReceived: dealAggregates._sum.amount_received || 0,
      pendingFollowups,
      overdueFollowups,
      todayFollowups,
      pendingActivities,
      pipeline: Object.entries(pipeline).map(([stage, count]) => ({ stage, count })),
      sources,
    };

    // Cache for 10 seconds
    analyticsCache.set(cid, { data: result, expiry: now + 10000 });

    return ok(result);
  } catch (err: any) {
    console.error("CRM Analytics error:", err);
    return serverError(err.message);
  }
});
