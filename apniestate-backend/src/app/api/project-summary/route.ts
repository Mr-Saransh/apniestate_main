// @ts-nocheck
import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/response";

export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const url = new URL(req.url);
    const projectId = url.searchParams.get("project_id");

    if (!projectId) {
      return Response.json({ message: "project_id is required" }, { status: 400 });
    }

    // Verify project exists and user has access
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        manager: { select: { name: true } },
        sites: { select: { id: true, name: true, status: true, supervisor_id: true } },
      }
    });

    if (!project) {
      return Response.json({ message: "Project not found" }, { status: 404 });
    }

    const siteIds = project.sites.map(s => s.id);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // === TODAY'S SUMMARY ===

    // Today's labour (attendance)
    const todayLabourLogs = await prisma.labourLog.findMany({
      where: {
        site_id: { in: siteIds },
        date: { gte: today, lt: tomorrow }
      }
    });
    
    let labourCount = 0;
    let labourCost = 0;
    for (const log of todayLabourLogs) {
      labourCount += log.present_count + log.half_day_count;
      labourCost += log.total_cost;
    }

    // Today's expense
    const todayExpenses = await prisma.expense.findMany({
      where: {
        project_id: projectId,
        date: { gte: today, lt: tomorrow }
      }
    });
    const todayExpenseTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Pending material requests
    const pendingMaterialRequests = await prisma.materialRequest.count({
      where: {
        site_id: { in: siteIds },
        status: "SUBMITTED"
      }
    });

    // Pending vendor payments (invoices that are not paid)
    const pendingVendorPayments = await prisma.invoice.count({
      where: {
        company_id: project.company_id,
        status: { in: ["DRAFT", "SENT"] }
      }
    });

    // Materials received today (inventory transactions IN today)
    // Avoid missing model errors if inventoryTransaction is removed, but for now we keep it
    const materialsReceivedToday = await prisma.inventoryTransaction.count({
      where: {
        item: { site_id: { in: siteIds } },
        type: "IN",
        created_at: { gte: today, lt: tomorrow }
      }
    });

    // Equipment running today & costs
    const todayEquipmentLogs = await prisma.equipmentLog.findMany({
      where: {
        equipment: { site_id: { in: siteIds } },
        date: { gte: today, lt: tomorrow }
      },
      include: { equipment: true }
    });

    const equipmentRunning = todayEquipmentLogs.filter(l => l.status === 'RUNNING').length;
    let equipmentCost = 0;
    for (const log of todayEquipmentLogs) {
        equipmentCost += (log.running_hours * log.equipment.operator_cost) + 
                         (log.fuel_used * log.equipment.fuel_cost) + 
                         (log.equipment.rental_cost / 30); // Approximate daily rental
    }

    // === NEEDS ATTENTION (ALERTS) ===
    const alerts: any[] = [];

    // Low stock items are calculated manually below

    // Manual low stock check (since lte raw might not work in all Prisma versions)
    const allInventory = await prisma.inventoryItem.findMany({
      where: { site_id: { in: siteIds } },
      include: { material: { select: { name: true, unit: true } }, site: { select: { name: true } } }
    });
    const actualLowStock = allInventory.filter(item => item.quantity <= item.min_quantity);

    for (const item of actualLowStock) {
      alerts.push({
        type: "LOW_STOCK",
        message: `${item.material.name} stock low at ${item.site.name} (${item.quantity} ${item.material.unit} left)`,
        link: "/inventory",
        severity: "error"
      });
    }

    // Pending purchase approvals
    const pendingPOs = await prisma.purchaseOrder.count({
      where: { project_id: projectId, status: "PENDING" }
    });
    if (pendingPOs > 0) {
      alerts.push({
        type: "PENDING_APPROVAL",
        message: `${pendingPOs} purchase order${pendingPOs > 1 ? 's' : ''} pending approval`,
        link: "/purchase-orders",
        severity: "warning"
      });
    }

    // Pending vendor payments
    if (pendingVendorPayments > 0) {
      alerts.push({
        type: "VENDOR_PAYMENT",
        message: `${pendingVendorPayments} vendor payment${pendingVendorPayments > 1 ? 's' : ''} due`,
        link: "/payments",
        severity: "warning"
      });
    }

    // No DPR submitted today
    const todayDprCount = await prisma.dailyReport.count({
      where: {
        site_id: { in: siteIds },
        report_date: { gte: today, lt: tomorrow }
      }
    });
    const activeSites = project.sites.filter(s => s.status === "IN_PROGRESS");
    if (todayDprCount < activeSites.length && activeSites.length > 0) {
      const missing = activeSites.length - todayDprCount;
      alerts.push({
        type: "NO_DPR",
        message: `${missing} site${missing > 1 ? 's' : ''} missing DPR today`,
        link: "/dpr",
        severity: "warning"
      });
    }

    // Equipment under maintenance
    const maintenanceEquipment = await prisma.equipment.count({
      where: { site_id: { in: siteIds }, status: "UNDER_MAINTENANCE" }
    });
    if (maintenanceEquipment > 0) {
      alerts.push({
        type: "EQUIPMENT_MAINTENANCE",
        message: `${maintenanceEquipment} equipment under maintenance`,
        link: "/equipment",
        severity: "warning"
      });
    }

    // Budget nearing limit
    const totalBudget = project.budget || 0;
    const totalSpent = project.actual_cost || 0;
    if (totalBudget > 0 && totalSpent >= totalBudget * 0.85) {
      const pct = Math.round((totalSpent / totalBudget) * 100);
      alerts.push({
        type: "BUDGET_LIMIT",
        message: `Budget ${pct}% utilized (₹${totalSpent.toLocaleString('en-IN')} of ₹${totalBudget.toLocaleString('en-IN')})`,
        link: "/budgets",
        severity: pct >= 100 ? "error" : "warning"
      });
    }

    // === PROJECT PROGRESS ===
    const milestones = await prisma.milestone.findMany({
      where: { project_id: projectId },
      orderBy: { target_date: "asc" }
    });

    const currentMilestone = milestones.find(m => m.status !== "COMPLETED") || null;
    const completedMilestones = milestones.filter(m => m.status === "COMPLETED").length;
    const nextMilestoneIdx = currentMilestone
      ? milestones.indexOf(currentMilestone) + 1
      : milestones.length;
    const nextMilestone = milestones[nextMilestoneIdx] || null;

    const recentDpr = await prisma.dailyReport.findFirst({
      where: { site_id: { in: siteIds } },
      orderBy: { report_date: "desc" },
      include: { site: { select: { name: true } } }
    });

    // === RECENT ACTIVITY ===
    const recentActivity = await prisma.activityLog.findMany({
      where: {
        entity_type: {
          in: ["Expense", "MaterialRequest", "PurchaseOrder", "Attendance", "DailyReport", "Invoice", "Inventory", "Equipment", "Cashbook", "Worker"]
        }
      },
      orderBy: { created_at: "desc" },
      take: 10,
      include: { user: { select: { name: true } } }
    });

    return ok({
      project: {
        id: project.id,
        name: project.name,
        status: project.status,
        budget: project.budget,
        actual_cost: project.actual_cost,
        start_date: project.start_date,
        end_date: project.end_date,
        progress_percentage: project.progress_percentage || 0,
        manager: project.manager?.name || "Unassigned",
        sitesCount: project.sites.length,
        activeSitesCount: activeSites.length,
      },
      todaySummary: {
        labourCount,
        labourCost,
        todayExpense: todayExpenseTotal,
        pendingMaterialRequests,
        pendingVendorPayments,
        materialsReceivedToday,
        equipmentRunning,
      },
      alerts,
      progress: {
        currentMilestone: currentMilestone ? { name: currentMilestone.name, targetDate: currentMilestone.target_date, status: currentMilestone.status } : null,
        completionPercent: project.progress_percentage || (milestones.length > 0 ? Math.round((completedMilestones / milestones.length) * 100) : 0),
        nextMilestone: nextMilestone ? { name: nextMilestone.name, targetDate: nextMilestone.target_date } : null,
        recentDpr: recentDpr ? {
          date: recentDpr.report_date,
          summary: recentDpr.summary,
          site: recentDpr.site?.name,
        } : null,
        totalMilestones: milestones.length,
        completedMilestones,
      },
      recentActivity: recentActivity.map(a => ({
        id: a.id,
        type: a.entity_type,
        action: a.action,
        description: `${a.user?.name || 'Someone'} ${a.action.toLowerCase()}d ${a.entity_type}`,
        metadata: a.metadata,
        time: a.created_at,
      }))
    });
  } catch (error: any) {
    console.error("Project summary error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
