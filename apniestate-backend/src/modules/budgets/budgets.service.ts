import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { CreateBudgetSchema, UpdateBudgetSchema } from "./budgets.schema";

/**
 * Standard mapping of raw expense / transaction categories to unified budget categories
 */
function normalizeExpenseCategory(rawCat: string): string {
  const cat = (rawCat || "").trim().toUpperCase();
  if (["WORKFORCE", "LABOUR", "LABOR", "WAGES", "SALARY", "MUSTER"].some(k => cat.includes(k))) {
    return "LABOUR";
  }
  if (["MATERIAL", "MATERIALS", "STOCK", "CEMENT", "STEEL", "BRICK", "SAND", "AGGREGATE", "TILES", "PAINT"].some(k => cat.includes(k))) {
    return "MATERIALS";
  }
  if (["EQUIPMENT", "MACHINERY", "MACHINE", "JCB", "CRANE", "MIXER", "FUEL", "DIESEL", "GENERATOR"].some(k => cat.includes(k))) {
    return "EQUIPMENT";
  }
  if (["SUBCONTRACT", "SUBCONTRACTS", "CONTRACTOR", "FABRICATION", "PLUMBING", "ELECTRICAL"].some(k => cat.includes(k))) {
    return "SUBCONTRACT";
  }
  if (["OVERHEAD", "GENERAL", "OFFICE", "PETTY_CASH", "FOOD", "TEA", "TRAVEL", "PERMIT", "LEGAL", "BROKER"].some(k => cat.includes(k))) {
    return "OVERHEAD";
  }
  if (["CONTINGENCY", "EMERGENCY", "BUFFER", "MISC", "MISCELLANEOUS"].some(k => cat.includes(k))) {
    return "CONTINGENCY";
  }
  return "OTHER";
}

/**
 * Calculate live actual spending for a project across all real operational aspects:
 * 1. Labour logs & worker wage muster
 * 2. Purchase Orders (approved / delivered materials)
 * 3. Equipment rental & fuel logs
 * 4. Direct expenses
 * 5. Cashbook expense outflows
 */
export async function calculateProjectCategorySpending(projectId: string): Promise<Record<string, number>> {
  const spending: Record<string, number> = {
    LABOUR: 0,
    MATERIALS: 0,
    EQUIPMENT: 0,
    SUBCONTRACT: 0,
    OVERHEAD: 0,
    CONTINGENCY: 0,
    OTHER: 0,
  };

  try {
    // 1. Fetch project sites
    const sites = await prisma.site.findMany({
      where: { project_id: projectId },
      select: { id: true }
    });
    const siteIds = sites.map(s => s.id);

    // 2. Parallel query all operational cost sources
    const [labourLogs, purchaseOrders, equipmentList, expenses, cashbookOutflows] = await Promise.all([
      siteIds.length > 0
        ? prisma.labourLog.findMany({
            where: { site_id: { in: siteIds } },
            include: { category: true }
          })
        : [],
      prisma.purchaseOrder.findMany({
        where: {
          project_id: projectId,
          status: { in: ["APPROVED", "SENT", "DELIVERED", "PARTIAL"] }
        },
        select: { total_amount: true }
      }),
      prisma.equipment.findMany({
        where: {
          OR: [
            { project_id: projectId },
            siteIds.length > 0 ? { site_id: { in: siteIds } } : { project_id: projectId }
          ]
        },
        select: { rental_cost: true, fuel_cost: true, operator_cost: true, maintenance_cost: true }
      }),
      prisma.expense.findMany({
        where: {
          OR: [
            { project_id: projectId },
            siteIds.length > 0 ? { site_id: { in: siteIds } } : { project_id: projectId }
          ]
        },
        select: { amount: true, category: true }
      }),
      prisma.cashbook.findMany({
        where: {
          project_id: projectId,
          type: "DEBIT"
        },
        select: { amount: true, category: true }
      })
    ]);

    // ─── A. Accumulate Labour Spending ───
    for (const log of labourLogs) {
      if (log.total_cost && log.total_cost > 0) {
        spending.LABOUR += log.total_cost;
      } else {
        const dailyWage = log.category?.daily_wage || 0;
        const otMult = log.category?.ot_multiplier || 1.5;
        const halfMult = log.category?.half_day_multiplier || 0.5;
        spending.LABOUR +=
          (log.present_count || 0) * dailyWage +
          (log.half_day_count || 0) * (dailyWage * halfMult) +
          (log.ot_hours || 0) * ((dailyWage / 8) * otMult);
      }
    }

    // ─── B. Accumulate Purchase Orders (Materials) ───
    for (const po of purchaseOrders) {
      spending.MATERIALS += po.total_amount || 0;
    }

    // ─── C. Accumulate Equipment Costs ───
    for (const eq of equipmentList) {
      spending.EQUIPMENT +=
        (eq.rental_cost || 0) +
        (eq.fuel_cost || 0) +
        (eq.operator_cost || 0) +
        (eq.maintenance_cost || 0);
    }

    // ─── D. Accumulate Expenses ───
    for (const exp of expenses) {
      const cat = normalizeExpenseCategory(exp.category);
      if (spending[cat] !== undefined) {
        spending[cat] += exp.amount || 0;
      } else {
        spending.OTHER += exp.amount || 0;
      }
    }

    // ─── E. Accumulate Cashbook Outflows (Overheads & General Site Cash) ───
    for (const cb of cashbookOutflows) {
      const cat = normalizeExpenseCategory(cb.category || "GENERAL");
      // Add cashbook if not already duplicated in expenses
      if (cat === "OVERHEAD" || cat === "OTHER") {
        spending[cat] += cb.amount || 0;
      }
    }
  } catch (err) {
    console.error("Error computing project category spending:", err);
  }

  return spending;
}

/**
 * Get budgets for a project (or all), with live actual spending and no fake dummy data.
 */
export async function getBudgets(projectId?: string) {
  const where: any = {};
  if (projectId) where.project_id = projectId;

  const budgets = await prisma.budget.findMany({
    where,
    include: {
      project: { select: { id: true, name: true, budget: true } },
      creator: { select: { id: true, name: true } },
    },
    orderBy: { created_at: "asc" },
  });

  const projectSpendingCache: Record<string, Record<string, number>> = {};
  const getSpendingForProject = async (pId: string) => {
    if (!projectSpendingCache[pId]) {
      projectSpendingCache[pId] = await calculateProjectCategorySpending(pId);
    }
    return projectSpendingCache[pId];
  };

  const resolved = await Promise.all(
    budgets.map(async (b) => {
      const liveSpending = await getSpendingForProject(b.project_id);
      let normCat = b.category.toString().toUpperCase();
      if (normCat === "MATERIAL") normCat = "MATERIALS";
      if (normCat === "SUBCONTRACTS") normCat = "SUBCONTRACT";
      if (normCat === "GENERAL" || normCat === "OFFICE") normCat = "OVERHEAD";

      const spent = liveSpending[normCat] ?? (liveSpending[b.category] || b.spent || 0);
      const remaining = b.allocated - spent;
      const utilization = b.allocated > 0 ? Math.round((spent / b.allocated) * 100) : 0;
      const isOverrun = spent > b.allocated && b.allocated > 0;
      const overrunAmount = isOverrun ? spent - b.allocated : 0;

      return {
        ...b,
        spent,
        remaining,
        utilization,
        is_overrun: isOverrun,
        overrun_amount: overrunAmount,
      };
    })
  );

  return resolved;
}


export async function getBudgetById(id: string) {
  const budget = await prisma.budget.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, name: true, budget: true } },
      creator: { select: { id: true, name: true } },
    },
  });

  if (!budget) return null;

  const liveSpending = await calculateProjectCategorySpending(budget.project_id);
  const spent = liveSpending[budget.category] || budget.spent || 0;
  return {
    ...budget,
    spent,
    remaining: budget.allocated - spent,
    utilization: budget.allocated > 0 ? Math.round((spent / budget.allocated) * 100) : 0,
  };
}

/**
 * Create or Upsert a Budget Category for a Project
 */
export async function createBudget(data: z.infer<typeof CreateBudgetSchema>, userId: string) {
  // Check if a budget with this category already exists for the project
  const existing = await prisma.budget.findFirst({
    where: {
      project_id: data.project_id,
      category: data.category as any,
    },
  });

  let budgetRecord;
  if (existing) {
    budgetRecord = await prisma.budget.update({
      where: { id: existing.id },
      data: {
        allocated: data.allocated,
        description: data.description,
      },
      include: {
        project: { select: { id: true, name: true } },
      },
    });
  } else {
    budgetRecord = await prisma.budget.create({
      data: {
        project_id: data.project_id,
        category: data.category as any,
        allocated: data.allocated,
        spent: data.spent || 0,
        description: data.description,
        created_by: userId,
      },
      include: {
        project: { select: { id: true, name: true } },
      },
    });
  }

  // Synchronize project.budget with total allocated budgets
  await syncProjectTotalBudget(data.project_id);

  return budgetRecord;
}

export async function updateBudget(id: string, data: z.infer<typeof UpdateBudgetSchema>) {
  const updated = await prisma.budget.update({
    where: { id },
    data: data as any,
    include: {
      project: { select: { id: true, name: true } },
    },
  });

  await syncProjectTotalBudget(updated.project_id);
  return updated;
}

export async function deleteBudget(id: string) {
  const existing = await prisma.budget.findUnique({
    where: { id },
    select: { project_id: true }
  });

  const deleted = await prisma.budget.delete({ where: { id } });

  if (existing) {
    await syncProjectTotalBudget(existing.project_id);
  }
  return deleted;
}

/**
 * Keep project.budget in sync with total allocated category budgets
 */
async function syncProjectTotalBudget(projectId: string) {
  const allBudgets = await prisma.budget.findMany({
    where: { project_id: projectId },
    select: { allocated: true },
  });
  const totalAllocated = allBudgets.reduce((s, b) => s + b.allocated, 0);
  if (totalAllocated > 0) {
    await prisma.project.update({
      where: { id: projectId },
      data: { budget: totalAllocated },
    });
  }
}

/**
 * 1-Click Quick Preset Setup for Indian Construction:
 * - Materials: 45%
 * - Labour: 25%
 * - Subcontracts: 12%
 * - Equipment: 8%
 * - Overheads: 5%
 * - Contingency: 5%
 */
export async function applyRecommendedPreset(projectId: string, totalBudget: number, userId: string) {
  const splits: { category: any; pct: number; label: string }[] = [
    { category: "MATERIALS", pct: 0.45, label: "Cement, steel, sand, aggregate, bricks and materials" },
    { category: "LABOUR", pct: 0.25, label: "Daily muster wages, mason, helper, and skilled workforce" },
    { category: "SUBCONTRACT", pct: 0.12, label: "Contractors, plumbing, electrical, and fabrication works" },
    { category: "EQUIPMENT", pct: 0.08, label: "JCB, mixer, crane rentals, fuel, and machinery" },
    { category: "OVERHEAD", pct: 0.05, label: "Site office, tea, permits, water, and administration" },
    { category: "CONTINGENCY", pct: 0.05, label: "Emergency price buffer and unexpected site expenses" },
  ];

  const results = [];
  for (const s of splits) {
    const allocated = Math.round(totalBudget * s.pct);
    const existing = await prisma.budget.findFirst({
      where: { project_id: projectId, category: s.category }
    });

    if (existing) {
      const u = await prisma.budget.update({
        where: { id: existing.id },
        data: { allocated, description: s.label }
      });
      results.push(u);
    } else {
      const c = await prisma.budget.create({
        data: {
          project_id: projectId,
          category: s.category,
          allocated,
          spent: 0,
          description: s.label,
          created_by: userId
        }
      });
      results.push(c);
    }
  }

  // Update project total budget
  await prisma.project.update({
    where: { id: projectId },
    data: { budget: totalBudget }
  });

  return getBudgets(projectId);
}

/**
 * Comprehensive summary of project budget vs actual and money leakages
 */
export async function getProjectBudgetSummary(projectId: string) {
  const budgets = await getBudgets(projectId);
  const liveSpending = await calculateProjectCategorySpending(projectId);

  const totalAllocated = budgets.reduce((sum, b) => sum + b.allocated, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const variance = totalAllocated - totalSpent;
  const utilizationRate = totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0;

  // Detect money leakages (categories where spent exceeds budget)
  const leakages = budgets
    .filter((b) => b.allocated > 0 && b.spent > b.allocated)
    .map((b) => ({
      category: b.category,
      allocated: b.allocated,
      spent: b.spent,
      leakage_amount: b.spent - b.allocated,
      utilization: b.utilization,
    }));

  const totalLeakage = leakages.reduce((sum, l) => sum + l.leakage_amount, 0);

  return {
    total_allocated: totalAllocated,
    total_spent: totalSpent,
    variance,
    utilization_rate: utilizationRate,
    has_leakage: leakages.length > 0,
    total_leakage_amount: totalLeakage,
    leakages,
    by_category: budgets.map((b) => ({
      id: b.id,
      category: b.category,
      allocated: b.allocated,
      spent: b.spent,
      remaining: b.remaining,
      utilization: b.utilization,
      is_overrun: b.is_overrun,
      overrun_amount: b.overrun_amount,
    })),
  };
}
