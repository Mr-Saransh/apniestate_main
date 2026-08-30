import { NextRequest } from "next/server";
import { withCrmAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok, badRequest, forbidden, serverError } from "@/lib/response";
import { getCrmUserContext } from "@/modules/crm/crm-permissions";

interface DistributeBody {
  lead_ids?: string[];
  distribute_unassigned?: boolean;
  strategy: "ROUND_ROBIN" | "LOAD_BALANCED" | "CUSTOM";
  target_user_ids?: string[];
  custom_allocations?: { user_id: string; count: number }[];
}

// POST /api/crm/leads/distribute — Smart lead distribution to telecallers / sales team
export const POST = withCrmAuth(async (req: NextRequest, user) => {
  try {
    if (!user.company_id) return badRequest("No company context");

    const crmCtx = await getCrmUserContext(user);
    if (!crmCtx) {
      return forbidden("You do not have CRM permissions in this company.");
    }

    if (!crmCtx.hasCapability("CRM_REASSIGN_LEADS") && crmCtx.crmRole !== "BUILDER" && crmCtx.crmRole !== "CRM_MANAGER") {
      return forbidden("Only Builders and CRM Managers can distribute leads to team members.");
    }

    const cid = user.company_id;
    const body: DistributeBody = await req.json();

    // 1. Determine which leads to distribute
    let leadsToDistribute: { id: string; name: string }[] = [];

    if (body.lead_ids && body.lead_ids.length > 0) {
      leadsToDistribute = await prisma.crmLead.findMany({
        where: {
          id: { in: body.lead_ids },
          company_id: cid,
        },
        select: { id: true, name: true },
      });
    } else if (body.distribute_unassigned) {
      leadsToDistribute = await prisma.crmLead.findMany({
        where: {
          company_id: cid,
          assigned_to: null,
        },
        select: { id: true, name: true },
        orderBy: { created_at: "desc" },
      });
    } else {
      return badRequest("Please specify lead_ids or distribute_unassigned: true");
    }

    if (leadsToDistribute.length === 0) {
      return badRequest("No eligible leads found for distribution.");
    }

    // 2. Fetch active CRM team members in the company
    const allMemberships = await prisma.companyMembership.findMany({
      where: {
        company_id: cid,
        status: "ACTIVE",
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    const eligibleMembers = allMemberships
      .filter((m) => m.roles.some((r) => ["CRM_MANAGER", "TELECALLER", "SALES_EXECUTIVE"].includes(r)))
      .map((m) => m.user);

    if (eligibleMembers.length === 0) {
      return badRequest("No active telecallers or sales team members found to distribute leads to.");
    }

    // Filter by selected target user IDs if provided
    let targetUsers = eligibleMembers;
    if (body.target_user_ids && body.target_user_ids.length > 0) {
      targetUsers = eligibleMembers.filter((u) => body.target_user_ids!.includes(u.id));
    }

    if (targetUsers.length === 0) {
      return badRequest("No valid recipient team members selected.");
    }

    // 3. Compute distribution mapping: leadId -> targetUserId
    const distributionPlan: { leadId: string; userId: string; userName: string }[] = [];
    const recipientSummary: Record<string, { userId: string; name: string; count: number }> = {};
    targetUsers.forEach((u) => {
      recipientSummary[u.id] = { userId: u.id, name: u.name, count: 0 };
    });

    if (body.strategy === "CUSTOM" && body.custom_allocations && body.custom_allocations.length > 0) {
      // Custom allocation by exact counts
      let currentLeadIndex = 0;
      for (const alloc of body.custom_allocations) {
        const u = targetUsers.find((tu) => tu.id === alloc.user_id);
        if (!u) continue;
        const count = Math.min(alloc.count, leadsToDistribute.length - currentLeadIndex);
        for (let i = 0; i < count; i++) {
          const lead = leadsToDistribute[currentLeadIndex++];
          distributionPlan.push({ leadId: lead.id, userId: u.id, userName: u.name });
          recipientSummary[u.id].count++;
        }
        if (currentLeadIndex >= leadsToDistribute.length) break;
      }
      // Any remaining leads round-robin across targetUsers
      while (currentLeadIndex < leadsToDistribute.length) {
        const u = targetUsers[currentLeadIndex % targetUsers.length];
        const lead = leadsToDistribute[currentLeadIndex++];
        distributionPlan.push({ leadId: lead.id, userId: u.id, userName: u.name });
        recipientSummary[u.id].count++;
      }
    } else if (body.strategy === "LOAD_BALANCED") {
      // Load balanced: distribute to users with lowest active lead count
      const leadCounts = await prisma.crmLead.groupBy({
        by: ["assigned_to"],
        where: {
          company_id: cid,
          assigned_to: { in: targetUsers.map((u) => u.id) },
        },
        _count: true,
      });

      const userWorkload = targetUsers.map((u) => {
        const found = leadCounts.find((lc) => lc.assigned_to === u.id);
        return {
          userId: u.id,
          name: u.name,
          currentLeads: found ? found._count : 0,
        };
      });

      for (const lead of leadsToDistribute) {
        // Find user with minimum current + newly assigned leads
        userWorkload.sort((a, b) => a.currentLeads - b.currentLeads);
        const leastBusy = userWorkload[0];
        distributionPlan.push({ leadId: lead.id, userId: leastBusy.userId, userName: leastBusy.name });
        recipientSummary[leastBusy.userId].count++;
        leastBusy.currentLeads++;
      }
    } else {
      // Default: Equal Round-Robin
      for (let i = 0; i < leadsToDistribute.length; i++) {
        const u = targetUsers[i % targetUsers.length];
        const lead = leadsToDistribute[i];
        distributionPlan.push({ leadId: lead.id, userId: u.id, userName: u.name });
        recipientSummary[u.id].count++;
      }
    }

    // 4. Execute database updates in chunks
    const groupByUser: Record<string, string[]> = {};
    for (const item of distributionPlan) {
      if (!groupByUser[item.userId]) groupByUser[item.userId] = [];
      groupByUser[item.userId].push(item.leadId);
    }

    await prisma.$transaction(async (tx) => {
      for (const [recipientId, leadIds] of Object.entries(groupByUser)) {
        await tx.crmLead.updateMany({
          where: { id: { in: leadIds }, company_id: cid },
          data: { assigned_to: recipientId },
        });
      }

      // Create activity log entries
      await tx.crmActivity.createMany({
        data: targetUsers
          .filter((u) => recipientSummary[u.id].count > 0)
          .map((u) => ({
            company_id: cid,
            created_by: user.sub,
            type: "NOTE" as const,
            title: `Smart Distributed ${recipientSummary[u.id].count} leads to ${u.name}`,
            description: `Strategy: ${body.strategy || "ROUND_ROBIN"}`,
          })),
      });
    });

    const summaryList = Object.values(recipientSummary).filter((s) => s.count > 0);

    return ok({
      success: true,
      total_distributed: distributionPlan.length,
      strategy: body.strategy || "ROUND_ROBIN",
      summary: summaryList,
      message: `Successfully distributed ${distributionPlan.length} leads across ${summaryList.length} telecallers!`,
    });
  } catch (err: any) {
    console.error("Smart Lead Distribution error:", err);
    return serverError(err.message);
  }
});
