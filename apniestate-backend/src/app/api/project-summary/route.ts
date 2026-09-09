// @ts-nocheck
import { NextRequest } from "next/server";
// Force rebuild to clear turbopack cache
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
        sites: { include: { supervisor: { select: { name: true } } } },
        project_assignments: {
          where: { role: { in: ['SITE_SUPERVISOR', 'PROJECT_MANAGER'] } },
          include: { user: { select: { name: true } } }
        }
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
      },
      include: { category: true }
    });
    
    let labourCount = 0;
    let labourCost = 0;
    for (const log of todayLabourLogs) {
      labourCount += (log.present_count || 0) + (log.half_day_count || 0);
      if (log.total_cost && log.total_cost > 0) {
        labourCost += log.total_cost;
      } else if (log.category && log.category.daily_wage > 0) {
        const regularCost = (log.present_count || 0) * log.category.daily_wage;
        const halfCost = (log.half_day_count || 0) * (log.category.daily_wage * (log.category.half_day_multiplier || 0.5));
        const otCost = (log.ot_hours || 0) * ((log.category.daily_wage / 8) * (log.category.ot_multiplier || 1.5));
        labourCost += regularCost + halfCost + otCost;
      }
    }

    // Today's expense
    const todayExpenses = await prisma.expense.findMany({
      where: {
        project_id: projectId,
        date: { gte: today, lt: tomorrow }
      }
    });
    const todayExpenseTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Today's POs
    const todayPOs = await prisma.purchaseOrder.findMany({
      where: {
        project_id: projectId,
        created_at: { gte: today, lt: tomorrow },
        status: { in: ['APPROVED', 'SENT'] }
      }
    });
    const todayPOCost = todayPOs.reduce((sum, po) => sum + po.total_amount, 0);

    // Pending material requests
    const pendingMaterialRequests = await prisma.materialRequest.count({
      where: {
        site_id: { in: siteIds },
        status: "SUBMITTED"
      }
    });

    // Pending vendor payments (unpaid invoices)
    const unpaidInvoices = await prisma.invoice.findMany({
      where: {
        company_id: project.company_id,
        status: { in: ["DRAFT", "SENT"] }
      }
    });
    const pendingVendorPayments = unpaidInvoices.length;
    const pendingVendorPaymentAmount = unpaidInvoices.reduce((sum, inv) => sum + (inv.total || inv.amount || 0), 0);

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

    // Calculate True Actual Cost (Total Spend)
    const expenses = await prisma.expense.findMany({ where: { project_id: projectId } });
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

    const pos = await prisma.purchaseOrder.findMany({ 
      where: { project_id: projectId, status: { in: ['APPROVED', 'SENT'] } } 
    });
    const totalPurchases = pos.reduce((s, p) => s + p.total_amount, 0);

    const equipment = await prisma.equipment.findMany({ where: { project_id: projectId } });
    const totalEquipmentCost = equipment.reduce((s, e) => s + e.rental_cost + e.fuel_cost, 0);

    let totalLabourCost = 0;
    if (siteIds.length > 0) {
      const logs = await prisma.labourLog.findMany({
        where: { site_id: { in: siteIds } },
        include: { category: true }
      });
      totalLabourCost = logs.reduce((s, log) => {
        const dailyWage = log.category?.daily_wage || 0;
        const otMultiplier = log.category?.ot_multiplier || 1.5;
        const halfMultiplier = log.category?.half_day_multiplier || 0.5;
        const regularCost = log.present_count * dailyWage;
        const halfCost = log.half_day_count * (dailyWage * halfMultiplier);
        const otCost = log.ot_hours * ((dailyWage / 8) * otMultiplier);
        return s + regularCost + halfCost + otCost;
      }, 0);
    }
    const calculatedTotalSpent = totalExpenses + totalPurchases + totalEquipmentCost + totalLabourCost;

    // Budget nearing limit
    const totalBudget = project.budget || 0;
    if (totalBudget > 0) {
      const rawPct = (calculatedTotalSpent / totalBudget) * 100;
      const pct = rawPct > 0 && rawPct < 1 ? parseFloat(rawPct.toFixed(2)) : Math.round(rawPct);
      if (pct >= 85) {
        alerts.push({
          type: "BUDGET_LIMIT",
          message: `Budget ${pct}% utilized (₹${calculatedTotalSpent.toLocaleString('en-IN')} of ₹${totalBudget.toLocaleString('en-IN')})`,
          link: "/budgets",
          severity: pct >= 100 ? "error" : "warning"
        });
      }
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



    // Overdue Milestones check
    const overdueMilestones = milestones.filter(m => m.status !== "COMPLETED" && new Date(m.target_date) < today);
    if (overdueMilestones.length > 0) {
      alerts.push({
        type: "MILESTONE_OVERDUE",
        message: `${overdueMilestones.length} milestone${overdueMilestones.length > 1 ? 's are' : ' is'} overdue`,
        link: "/progress?tab=timeline",
        severity: "error"
      });
    }

    // Delayed Procurement POs check
    const delayedPOs = await prisma.purchaseOrder.findMany({
      where: {
        project_id: projectId,
        status: { in: ['APPROVED', 'SENT', 'PENDING'] },
        delivery_date: { lt: today }
      }
    });
    if (delayedPOs.length > 0) {
      alerts.push({
        type: "PROCUREMENT_DELAY",
        message: `${delayedPOs.length} purchase order${delayedPOs.length > 1 ? 's' : ''} past expected delivery date`,
        link: "/purchase?tab=orders",
        severity: "warning"
      });
    }

    // BOQ Material Variances
    const boqItems = await prisma.bOQItem.findMany({
      where: {
        category: { boq: { project_id: projectId } }
      },
      take: 6
    });
    const materialVariances = boqItems.map(item => ({
      id: item.id,
      name: item.description,
      unit: item.unit,
      planned: item.quantity,
      used: item.used_quantity,
      remaining: Math.max(0, item.quantity - item.used_quantity),
      percentUsed: item.quantity > 0 ? Math.round((item.used_quantity / item.quantity) * 100) : 0
    }));

    return ok({
      project: {
        id: project.id,
        name: project.name,
        status: project.status,
        budget: project.budget,
        actual_cost: calculatedTotalSpent,
        start_date: project.start_date,
        end_date: project.end_date,
        progress_percentage: project.progress_percentage || 0,
        manager: project.manager?.name || project.project_assignments?.find(a => a.role === 'PROJECT_MANAGER')?.user?.name || "Unassigned",
        supervisor: project.project_assignments?.find(a => a.role === 'SITE_SUPERVISOR')?.user?.name || project.sites[0]?.supervisor?.name || "Unassigned",
        sitesCount: project.sites.length,
        activeSitesCount: activeSites.length,
      },
      todaySummary: {
        labourCount,
        labourCost,
        todayExpense: todayExpenseTotal + labourCost + equipmentCost + todayPOCost,
        pendingMaterialRequests,
        pendingVendorPayments,
        pendingVendorPaymentAmount,
        materialsReceivedToday,
        equipmentRunning,
      },
      projectIntelligence: {
        budget: project.budget || 0,
        actualSpend: calculatedTotalSpent,
        remainingBudget: Math.max(0, (project.budget || 0) - calculatedTotalSpent),
        todayLabourCost: labourCost,
        pendingPaymentExposure: pendingVendorPaymentAmount,
        pendingPaymentCount: pendingVendorPayments,
        lowStockCount: actualLowStock.length,
        lowStockItems: actualLowStock.slice(0, 5).map(item => ({
          name: item.material.name,
          unit: item.material.unit,
          quantity: item.quantity,
          minQuantity: item.min_quantity,
          site: item.site.name
        })),
        procurementDelayCount: delayedPOs.length,
        overdueMilestoneCount: overdueMilestones.length,
        overdueMilestones: overdueMilestones.map(m => ({
          name: m.name,
          targetDate: m.target_date
        })),
        materialVariances
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
