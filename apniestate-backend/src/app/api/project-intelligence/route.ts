// @ts-nocheck
import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/response";

/**
 * GET /api/project-intelligence?project_id=xxx
 * 
 * Returns comprehensive project intelligence data including:
 * - Health scores (deterministic, rule-based)
 * - QOM planned vs used
 * - Milestone planned vs actual
 * - Bottleneck detection
/**
 * Detects the construction work package / table based on item description and category name.
 */
function detectWorkTable(description: string, categoryName?: string): string {
  if (categoryName && categoryName.trim() && categoryName !== "General" && categoryName !== "Uncategorized") {
    return categoryName.trim();
  }

  const d = (description || "").toLowerCase();

  // 1. Excavation & Earthwork
  if (d.includes("excav") || d.includes("earth") || d.includes("soil") || d.includes("trench") || d.includes("plinth filling") || d.includes("filling available")) {
    return "Earthwork & Excavation";
  }

  // 2. Concrete & Structural RCC
  if (d.includes("concrete") || d.includes("rcc") || d.includes("pcc") || d.includes("cement") || d.includes("aggregate") || d.includes("m20") || d.includes("m25") || d.includes("m30") || d.includes("slump") || d.includes("ready mix")) {
    return "Concrete & Structural RCC";
  }

  // 3. Reinforcement & Steel
  if (d.includes("rebar") || d.includes("tmt") || d.includes("steel") || d.includes("reinforcement") || d.includes("fe500") || d.includes("fe550") || d.includes("binding wire") || d.includes("stirrup") || d.includes("8mm") || d.includes("10mm") || d.includes("12mm") || d.includes("16mm") || d.includes("20mm") || d.includes("25mm")) {
    return "Reinforcement & Steel Schedule";
  }

  // 4. Formwork & Shuttering
  if (d.includes("shuttering") || d.includes("formwork") || d.includes("centering") || d.includes("scaffolding") || d.includes("plywood") || d.includes("prop")) {
    return "Formwork & Scaffolding";
  }

  // 5. Masonry & Brickwork
  if (d.includes("brick") || d.includes("block") || d.includes("aac") || d.includes("flyash") || d.includes("masonry") || d.includes("mortar") || d.includes("sand")) {
    return "Masonry & Brickwork";
  }

  // 6. Plastering & Surface Prep
  if (d.includes("plaster") || d.includes("pointing") || d.includes("gypsum") || d.includes("pop") || d.includes("putty")) {
    return "Plastering & Surface Prep";
  }

  // 7. Flooring & Tiling
  if (d.includes("tile") || d.includes("granite") || d.includes("marble") || d.includes("vitrified") || d.includes("flooring") || d.includes("skirting") || d.includes("kota stone") || d.includes("paver")) {
    return "Flooring, Tiling & Cladding";
  }

  // 8. Plumbing & Sanitary
  if (d.includes("pipe") || d.includes("cpvc") || d.includes("upvc") || d.includes("plumbing") || d.includes("sanitary") || d.includes("drain") || d.includes("toilet") || d.includes("valve") || d.includes("faucet") || d.includes("tank")) {
    return "Plumbing & Sanitary Works";
  }

  // 9. Electrical & Power
  if (d.includes("wire") || d.includes("cable") || d.includes("conduit") || d.includes("switch") || d.includes("socket") || d.includes("electrical") || d.includes("light") || d.includes("panel") || d.includes("mcb")) {
    return "Electrical & Power Systems";
  }

  // 10. Painting & Protective Coating
  if (d.includes("paint") || d.includes("primer") || d.includes("distemper") || d.includes("enamel") || d.includes("emulsion") || d.includes("weathercoat")) {
    return "Painting & Protective Coating";
  }

  // 11. Doors, Windows & Glazing
  if (d.includes("door") || d.includes("window") || d.includes("shutter") || d.includes("frame") || d.includes("glass") || d.includes("choukhat")) {
    return "Doors, Windows & Glazing";
  }

  // 12. Waterproofing & Damp Proofing
  if (d.includes("waterproof") || d.includes("dpc") || d.includes("damp") || d.includes("membrane") || d.includes("bitumen") || d.includes("sealant")) {
    return "Waterproofing & Protection";
  }

  return categoryName || "General Construction Works";
}

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
      },
    });

    if (!project) {
      return Response.json({ message: "Project not found" }, { status: 404 });
    }

    const siteIds = project.sites.map((s) => s.id);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // ═══════════════════════════════════════════════════════════
    // 1. FINANCE & BUDGET DATA
    // ═══════════════════════════════════════════════════════════
    const expenses = await prisma.expense.findMany({ where: { project_id: projectId } });
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

    const pos = await prisma.purchaseOrder.findMany({
      where: { project_id: projectId, status: { in: ["APPROVED", "SENT", "DELIVERED", "PARTIAL"] } },
    });
    const totalPurchases = pos.reduce((s, p) => s + p.total_amount, 0);

    const equipment = await prisma.equipment.findMany({ where: { project_id: projectId } });
    const totalEquipmentCost = equipment.reduce((s, e) => s + e.rental_cost + e.fuel_cost, 0);

    let totalLabourCost = 0;
    if (siteIds.length > 0) {
      const logs = await prisma.labourLog.findMany({
        where: { site_id: { in: siteIds } },
        include: { category: true },
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

    const actualSpend = totalExpenses + totalPurchases + totalEquipmentCost + totalLabourCost;
    const totalBudget = project.budget || 0;
    const budgetUtilization = totalBudget > 0 ? Math.round((actualSpend / totalBudget) * 100) : 0;

    // Budget breakdown by category
    const budgets = await prisma.budget.findMany({ where: { project_id: projectId } });
    const budgetBreakdown = budgets.map((b) => ({
      category: b.category,
      allocated: b.allocated,
      spent: b.spent,
      utilization: b.allocated > 0 ? Math.round((b.spent / b.allocated) * 100) : 0,
    }));

    // Pending payment exposure
    const unpaidInvoices = await prisma.invoice.findMany({
      where: {
        project_id: projectId,
        status: { in: ["DRAFT", "PENDING", "APPROVED", "SENT", "OVERDUE"] },
      },
    });
    const pendingPaymentExposure = unpaidInvoices.reduce((sum, inv) => sum + (inv.total || inv.amount || 0), 0);

    // ═══════════════════════════════════════════════════════════
    // 2. QOM (BOQ) — PLANNED VS USED (Grouped by Work Tables)
    // ═══════════════════════════════════════════════════════════
    const boqItems = await prisma.bOQItem.findMany({
      where: { category: { boq: { project_id: projectId } } },
      include: {
        category: { select: { id: true, name: true } },
        material: { select: { name: true, unit: true } },
      },
    });

    const tableMap = new Map<string, any>();

    const qomVariances = boqItems.map((item) => {
      const planned = item.quantity;
      const used = item.used_quantity;
      const remaining = Math.max(0, planned - used);
      const percentUsed = planned > 0 ? Math.round((used / planned) * 100) : 0;
      const variance = used - planned;
      const rate = item.total_rate || (item.material_rate || 0) + (item.labour_rate || 0);
      const plannedCost = planned * rate;
      const usedCost = used * rate;

      let status: "normal" | "high" | "excess" | "low_remaining" = "normal";
      if (percentUsed > 100) status = "excess";
      else if (percentUsed > 85) status = "high";
      else if (remaining < planned * 0.15 && remaining > 0) status = "low_remaining";

      const itemData = {
        id: item.id,
        name: item.description,
        materialName: item.material?.name || item.description,
        unit: item.unit,
        planned,
        used,
        remaining,
        percentUsed,
        variance,
        status,
        rate,
        plannedCost,
        usedCost,
      };

      // Assign to Work Table (Discipline / Category)
      const tableName = detectWorkTable(item.description, item.category?.name);
      if (!tableMap.has(tableName)) {
        tableMap.set(tableName, {
          id: tableName.toLowerCase().replace(/[^a-z0-9]/g, "-"),
          name: tableName,
          itemsCount: 0,
          totalPlannedCost: 0,
          totalUsedCost: 0,
          totalVarianceCost: 0,
          overusedCount: 0,
          lowRemainingCount: 0,
          items: [],
        });
      }

      const table = tableMap.get(tableName);
      table.itemsCount++;
      table.totalPlannedCost += plannedCost;
      table.totalUsedCost += usedCost;
      table.totalVarianceCost += (usedCost - plannedCost);
      if (status === "excess") table.overusedCount++;
      if (status === "low_remaining") table.lowRemainingCount++;
      table.items.push(itemData);

      return itemData;
    });

    const workTables = Array.from(tableMap.values()).map((t) => {
      let percentUsed = 0;
      if (t.totalPlannedCost > 0) {
        percentUsed = Math.round((t.totalUsedCost / t.totalPlannedCost) * 100);
      } else if (t.items.length > 0) {
        const sumPct = t.items.reduce((s: number, it: any) => s + it.percentUsed, 0);
        percentUsed = Math.round(sumPct / t.items.length);
      }

      let status: "optimal" | "watch" | "critical" = "optimal";
      let statusLabel = "On Track";
      if (percentUsed > 100 || t.overusedCount > 0) {
        status = "critical";
        statusLabel = percentUsed > 100 ? "Budget Overrun" : "Excess Consumption";
      } else if (percentUsed > 85 || t.lowRemainingCount > 0) {
        status = "watch";
        statusLabel = "Near Limit";
      }

      return {
        ...t,
        percentUsed,
        status,
        statusLabel,
      };
    });

    const workTableStats = {
      totalTables: workTables.length,
      optimalTables: workTables.filter((t) => t.status === "optimal").length,
      watchTables: workTables.filter((t) => t.status === "watch").length,
      criticalTables: workTables.filter((t) => t.status === "critical").length,
      totalPlannedCost: workTables.reduce((s, t) => s + t.totalPlannedCost, 0),
      totalUsedCost: workTables.reduce((s, t) => s + t.totalUsedCost, 0),
      overallPercentUsed:
        workTables.reduce((s, t) => s + t.totalPlannedCost, 0) > 0
          ? Math.round(
              (workTables.reduce((s, t) => s + t.totalUsedCost, 0) /
                workTables.reduce((s, t) => s + t.totalPlannedCost, 0)) *
                100
            )
          : 0,
    };

    // ═══════════════════════════════════════════════════════════
    // 3. MILESTONES — PLANNED VS ACTUAL
    // ═══════════════════════════════════════════════════════════
    const milestones = await prisma.milestone.findMany({
      where: { project_id: projectId },
      orderBy: { target_date: "asc" },
    });

    const milestoneComparison = milestones.map((m) => {
      const plannedProgress = 100; // Each milestone should reach 100%
      const actualProgress = m.progress_percentage || (m.status === "COMPLETED" ? 100 : 0);
      const variance = actualProgress - plannedProgress;
      const isOverdue = m.status !== "COMPLETED" && new Date(m.target_date) < today;
      const daysOverdue = isOverdue
        ? Math.ceil((today.getTime() - new Date(m.target_date).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        id: m.id,
        name: m.name,
        targetDate: m.target_date,
        actualDate: m.actual_date,
        status: m.status,
        plannedProgress,
        actualProgress,
        variance,
        isOverdue,
        daysOverdue,
        weight: m.weight || 1,
      };
    });

    // Overall schedule variance
    const totalWeight = milestones.reduce((s, m) => s + (m.weight || 1), 0);
    const weightedActual = milestones.reduce((s, m) => {
      const progress = m.progress_percentage || (m.status === "COMPLETED" ? 100 : 0);
      return s + progress * (m.weight || 1);
    }, 0);
    const overallScheduleProgress = totalWeight > 0 ? Math.round(weightedActual / totalWeight) : 0;
    const overdueMilestones = milestoneComparison.filter((m) => m.isOverdue);

    // ═══════════════════════════════════════════════════════════
    // 4. PROCUREMENT STATUS
    // ═══════════════════════════════════════════════════════════
    const delayedPOs = await prisma.purchaseOrder.findMany({
      where: {
        project_id: projectId,
        status: { in: ["APPROVED", "SENT", "PENDING"] },
        delivery_date: { lt: today },
      },
      include: { vendor: { select: { name: true } } },
    });

    const allInventory = await prisma.inventoryItem.findMany({
      where: { site_id: { in: siteIds } },
      include: {
        material: { select: { name: true, unit: true, reorder_level: true } },
        site: { select: { name: true } },
      },
    });
    const lowStockItems = allInventory.filter((item) => item.quantity <= item.min_quantity);

    const pendingMaterialRequests = await prisma.materialRequest.count({
      where: { site_id: { in: siteIds }, status: "SUBMITTED" },
    });

    // ═══════════════════════════════════════════════════════════
    // 5. WORKFORCE / OPERATIONS
    // ═══════════════════════════════════════════════════════════
    const todayLabourLogs = await prisma.labourLog.findMany({
      where: { site_id: { in: siteIds }, date: { gte: today, lt: tomorrow } },
      include: { category: true },
    });
    let todayLabourCount = 0;
    let todayLabourCost = 0;
    for (const log of todayLabourLogs) {
      todayLabourCount += (log.present_count || 0) + (log.half_day_count || 0);
      if (log.total_cost && log.total_cost > 0) {
        todayLabourCost += log.total_cost;
      } else if (log.category && log.category.daily_wage > 0) {
        todayLabourCost += (log.present_count || 0) * log.category.daily_wage +
          (log.half_day_count || 0) * (log.category.daily_wage * (log.category.half_day_multiplier || 0.5)) +
          (log.ot_hours || 0) * ((log.category.daily_wage / 8) * (log.category.ot_multiplier || 1.5));
      }
    }

    const todayDprCount = await prisma.dailyReport.count({
      where: { site_id: { in: siteIds }, report_date: { gte: today, lt: tomorrow } },
    });
    const activeSites = project.sites.filter((s) => s.status === "IN_PROGRESS");
    const equipmentRunning = await prisma.equipment.count({
      where: { site_id: { in: siteIds }, status: "IN_USE" },
    });

    // ═══════════════════════════════════════════════════════════
    // 6. HEALTH SCORES (Deterministic, rule-based)
    // ═══════════════════════════════════════════════════════════

    // Finance Score
    let financeScore = 100;
    if (totalBudget > 0) {
      if (budgetUtilization > 100) financeScore = Math.max(25, 60 - (budgetUtilization - 100));
      else if (budgetUtilization > 90) financeScore = 68;
      else if (budgetUtilization > 75 && overallScheduleProgress < 50) financeScore = 72;
    }
    if (pendingPaymentExposure > 200000 || unpaidInvoices.length > 5) {
      financeScore = Math.max(30, financeScore - 15);
    }

    // Procurement Score
    let procurementScore = 100;
    const overusedQom = qomVariances.filter((v) => v.percentUsed > 100);
    if (delayedPOs.length > 0 || lowStockItems.length > 0 || overusedQom.length > 0) {
      const penalty = delayedPOs.length * 18 + lowStockItems.length * 12 + overusedQom.length * 10 + (pendingMaterialRequests > 3 ? 10 : 0);
      procurementScore = Math.max(35, 100 - penalty);
    }

    // Schedule Score
    let scheduleScore = 100;
    if (overdueMilestones.length > 0) {
      scheduleScore = Math.max(30, 80 - overdueMilestones.length * 20);
    } else {
      const nextMilestone = milestones.find((m) => m.status !== "COMPLETED");
      if (nextMilestone) {
        const daysToNext = Math.ceil((new Date(nextMilestone.target_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (daysToNext <= 3 && daysToNext >= 0) scheduleScore = 78;
      }
    }

    // Operations Score
    let opsScore = 100;
    if (todayLabourCount === 0) opsScore = 65;
    else if (todayDprCount < activeSites.length && activeSites.length > 0) opsScore = 80;

    const compositeScore = Math.round(
      financeScore * 0.28 + procurementScore * 0.28 + scheduleScore * 0.24 + opsScore * 0.2
    );

    let overallStatus = "Optimal";
    if (compositeScore < 60) overallStatus = "Critical";
    else if (compositeScore < 75) overallStatus = "Watch";
    else if (compositeScore < 90) overallStatus = "Stable";

    // ═══════════════════════════════════════════════════════════
    // 7. BOTTLENECK DETECTION
    // ═══════════════════════════════════════════════════════════
    const bottlenecks: any[] = [];

    // Schedule behind + Labour below
    if (overdueMilestones.length > 0 && todayLabourCount === 0) {
      bottlenecks.push({
        type: "MANPOWER",
        title: "Potential Manpower Bottleneck",
        reason: "Schedule is behind approved timeline with zero workforce logged today",
        affectedArea: "Schedule & Workforce",
        severity: "high",
        action: "Review workforce allocation and consider increasing manpower deployment",
      });
    }

    // Schedule behind + Material shortage
    if (overdueMilestones.length > 0 && lowStockItems.length > 0) {
      bottlenecks.push({
        type: "MATERIAL",
        title: "Potential Material Bottleneck",
        reason: `Schedule delayed with ${lowStockItems.length} material(s) below threshold`,
        affectedArea: "Schedule & Procurement",
        severity: "high",
        action: "Review material availability and expedite procurement for critical items",
      });
    }

    // PO overdue + Material not received
    if (delayedPOs.length > 0 && lowStockItems.length > 0) {
      bottlenecks.push({
        type: "PROCUREMENT",
        title: "Procurement Bottleneck",
        reason: `${delayedPOs.length} purchase order(s) past delivery date with low stock`,
        affectedArea: "Procurement",
        severity: "high",
        action: "Contact vendor(s) for delivery status or review alternate procurement options",
      });
    }

    // QOM excess usage + Budget increasing
    if (overusedQom.length > 0 && budgetUtilization > 75) {
      bottlenecks.push({
        type: "COST_MATERIAL",
        title: "Cost/Material Risk",
        reason: `${overusedQom.length} material(s) exceeding planned quantities with high budget utilization (${budgetUtilization}%)`,
        affectedArea: "Finance & Materials",
        severity: "medium",
        action: "Review material consumption patterns and adjust budget allocation if needed",
      });
    }

    // ═══════════════════════════════════════════════════════════
    // 8. INSIGHTS & RECOMMENDED ACTIONS
    // ═══════════════════════════════════════════════════════════
    const insights: any[] = [];

    // Material insights
    for (const v of qomVariances.filter((v) => v.percentUsed > 100)) {
      insights.push({
        type: "MATERIAL_EXCESS",
        severity: "warning",
        title: `${v.materialName} usage is ${v.percentUsed}% of planned quantity`,
        detail: `Planned: ${v.planned} ${v.unit}, Used: ${v.used} ${v.unit}, Variance: +${Math.abs(v.variance).toFixed(2)} ${v.unit}`,
        action: "Review material consumption and check for wastage or scope change",
      });
    }

    // Schedule insights
    for (const m of overdueMilestones) {
      insights.push({
        type: "SCHEDULE_DELAY",
        severity: "critical",
        title: `"${m.name}" is ${m.daysOverdue} day(s) overdue`,
        detail: `Target: ${new Date(m.targetDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`,
        action: "Review affected milestone and assess workforce/material availability",
      });
    }

    // Procurement insights
    for (const po of delayedPOs) {
      insights.push({
        type: "PROCUREMENT_DELAY",
        severity: "warning",
        title: `Purchase order from ${po.vendor?.name || "Vendor"} is past delivery date`,
        detail: `Expected: ${po.delivery_date ? new Date(po.delivery_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "N/A"}, Amount: ₹${po.total_amount.toLocaleString("en-IN")}`,
        action: "Contact vendor for delivery status or review alternate procurement",
      });
    }

    // Low stock insights
    for (const item of lowStockItems.slice(0, 5)) {
      insights.push({
        type: "LOW_STOCK",
        severity: "warning",
        title: `${item.material.name} approaching reorder level at ${item.site.name}`,
        detail: `Current: ${item.quantity} ${item.material.unit}, Min: ${item.min_quantity} ${item.material.unit}`,
        action: "Review procurement schedule and consider reordering",
      });
    }

    // Finance insights
    if (budgetUtilization > 90) {
      insights.push({
        type: "BUDGET_CRITICAL",
        severity: "critical",
        title: `Budget utilization at ${budgetUtilization}%`,
        detail: `Spent: ₹${actualSpend.toLocaleString("en-IN")} of ₹${totalBudget.toLocaleString("en-IN")}`,
        action: "Review spending patterns and assess need for budget revision",
      });
    }

    // Operations insights
    if (todayLabourCount === 0 && activeSites.length > 0) {
      insights.push({
        type: "NO_WORKFORCE",
        severity: "warning",
        title: "No workforce attendance logged today",
        detail: `${activeSites.length} active site(s) with zero workforce recorded`,
        action: "Confirm site activity and ensure attendance is being marked",
      });
    }

    // ═══════════════════════════════════════════════════════════
    // 9. EXISTING SUGGESTIONS
    // ═══════════════════════════════════════════════════════════
    let suggestions = [];
    try {
      suggestions = await prisma.intelligenceSuggestion.findMany({
        where: { project_id: projectId, status: "SUGGESTED" },
        orderBy: { sort_order: "asc" },
      });
    } catch (sugErr) {
      console.warn("Could not query intelligence suggestions:", sugErr);
      suggestions = [];
    }

    return ok({
      project: {
        id: project.id,
        name: project.name,
        status: project.status,
        budget: project.budget,
        actualSpend,
        startDate: project.start_date,
        endDate: project.end_date,
        progressPercentage: project.progress_percentage || 0,
      },
      health: {
        compositeScore,
        overallStatus,
        factors: {
          finance: { score: financeScore, status: financeScore >= 90 ? "OPTIMAL" : financeScore >= 75 ? "WATCH" : "CRITICAL" },
          procurement: { score: procurementScore, status: procurementScore >= 90 ? "OPTIMAL" : procurementScore >= 75 ? "WATCH" : "CRITICAL" },
          schedule: { score: scheduleScore, status: scheduleScore >= 90 ? "OPTIMAL" : scheduleScore >= 75 ? "WATCH" : "CRITICAL" },
          operations: { score: opsScore, status: opsScore >= 90 ? "OPTIMAL" : opsScore >= 75 ? "WATCH" : "CRITICAL" },
        },
        budgetUtilization,
        actualSpend,
        totalBudget,
        budgetBreakdown,
        pendingPaymentExposure,
        pendingPaymentCount: unpaidInvoices.length,
      },
      qomVariances,
      workTables,
      workTableStats,
      milestoneComparison,
      overallScheduleProgress,
      procurement: {
        delayedPOs: delayedPOs.map((po) => ({
          id: po.id,
          poNumber: po.po_number,
          vendor: po.vendor?.name,
          deliveryDate: po.delivery_date,
          amount: po.total_amount,
          status: po.status,
        })),
        lowStockItems: lowStockItems.slice(0, 10).map((item) => ({
          material: item.material.name,
          unit: item.material.unit,
          current: item.quantity,
          minimum: item.min_quantity,
          site: item.site.name,
        })),
        pendingRequests: pendingMaterialRequests,
      },
      workforce: {
        todayCount: todayLabourCount,
        todayCost: todayLabourCost,
        dprSubmitted: todayDprCount,
        activeSites: activeSites.length,
        equipmentRunning,
      },
      bottlenecks,
      insights,
      suggestions,
      milestonesExist: milestones.length > 0,
      hasBudget: totalBudget > 0,
      hasBoq: boqItems.length > 0,
    });
  } catch (error: any) {
    console.error("Project intelligence error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
