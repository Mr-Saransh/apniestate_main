import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { CreateBudgetSchema, UpdateBudgetSchema } from "./budgets.schema";

function mapExpenseCategoryToBudgetCategory(expCat: string): string {
  const cat = expCat.toUpperCase();
  if (cat === "WORKFORCE" || cat === "LABOUR") return "LABOUR";
  if (cat === "MATERIALS") return "MATERIALS";
  if (cat === "EQUIPMENT") return "EQUIPMENT";
  if (cat === "PERMITS" || cat === "OVERHEAD") return "OVERHEAD";
  if (cat === "SUBCONTRACT") return "SUBCONTRACT";
  if (cat === "CONTINGENCY") return "CONTINGENCY";
  return "OTHER";
}

async function getCategorySpent(projectId: string, category: string): Promise<number> {
  const expenses = await prisma.expense.findMany({
    where: {
      OR: [
        { project_id: projectId },
        { site: { project_id: projectId } }
      ]
    }
  });
  const categoryExpenses = expenses.filter(e => mapExpenseCategoryToBudgetCategory(e.category) === category);
  return categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
}

export async function getBudgets(projectId?: string) {
  const where: any = {};
  if (projectId) where.project_id = projectId;

  const budgets = await prisma.budget.findMany({
    where,
    include: {
      project: { select: { id: true, name: true } },
      creator: { select: { id: true, name: true } },
    },
    orderBy: { created_at: "desc" },
  });

  return Promise.all(budgets.map(async (b) => {
    const spent = await getCategorySpent(b.project_id, b.category);
    return {
      ...b,
      spent
    };
  }));
}

export async function getBudgetById(id: string) {
  const budget = await prisma.budget.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, name: true } },
      creator: { select: { id: true, name: true } },
    },
  });

  if (!budget) return null;

  const spent = await getCategorySpent(budget.project_id, budget.category);
  return {
    ...budget,
    spent
  };
}

export async function createBudget(data: z.infer<typeof CreateBudgetSchema>, userId: string) {
  return prisma.budget.create({
    data: { ...data, created_by: userId },
    include: {
      project: { select: { id: true, name: true } },
    },
  });
}

export async function updateBudget(id: string, data: z.infer<typeof UpdateBudgetSchema>) {
  return prisma.budget.update({
    where: { id },
    data,
    include: {
      project: { select: { id: true, name: true } },
    },
  });
}

export async function deleteBudget(id: string) {
  return prisma.budget.delete({ where: { id } });
}

export async function getProjectBudgetSummary(projectId: string) {
  const budgets = await prisma.budget.findMany({
    where: { project_id: projectId },
  });

  const updatedBudgets = await Promise.all(budgets.map(async (b) => {
    const spent = await getCategorySpent(b.project_id, b.category);
    return {
      ...b,
      spent
    };
  }));

  const totalAllocated = updatedBudgets.reduce((sum, b) => sum + b.allocated, 0);
  const totalSpent = updatedBudgets.reduce((sum, b) => sum + b.spent, 0);
  const variance = totalAllocated - totalSpent;
  const utilizationRate = totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0;

  return {
    total_allocated: totalAllocated,
    total_spent: totalSpent,
    variance,
    utilization_rate: utilizationRate,
    by_category: updatedBudgets.map(b => ({
      category: b.category,
      allocated: b.allocated,
      spent: b.spent,
      variance: b.allocated - b.spent,
    })),
  };
}
