import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/response";

export const GET = withAuth(async (req, user) => {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("project_id");

  if (!projectId) {
    return ok({
      total_expenses: 0,
      total_payments: 0,
      pending_payments: 0,
      total_invoiced: 0,
      receivable: 0,
      payable: 0,
      total_budget: 0,
      total_spent: 0,
      budget_variance: 0,
      revenue: 0,
      profit: 0,
      cash_flow: 0,
      expense_count: 0,
      invoice_count: 0,
      payment_count: 0,
    });
  }

  // Parallel fetch all independent finance data for this project
  const [
    project,
    budgets,
    expenses,
    pos,
    equipment,
    sites,
    cashbook,
    payments,
    invoices,
  ] = await Promise.all([
    prisma.project.findUnique({
      where: { id: projectId },
      select: { budget: true },
    }),
    prisma.budget.findMany({ where: { project_id: projectId } }),
    prisma.expense.findMany({ where: { project_id: projectId } }),
    prisma.purchaseOrder.findMany({
      where: { project_id: projectId, status: { in: ['APPROVED', 'SENT'] } },
    }),
    prisma.equipment.findMany({ where: { project_id: projectId } }),
    prisma.site.findMany({
      where: { project_id: projectId },
      select: { id: true },
    }),
    prisma.cashbook.findMany({ where: { project_id: projectId } }),
    prisma.payment.count(),
    prisma.invoice.count(),
  ]);

  // 1. Calculate Budget
  let totalBudget = project?.budget || 0;
  if (totalBudget === 0) {
    totalBudget = budgets.reduce((s, b) => s + b.allocated, 0);
  }

  // 2. Direct Expenses
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  // 3. Purchases (Approved POs)
  const totalPurchases = pos.reduce((s, p) => s + p.total_amount, 0);

  // 4. Equipment Cost
  const totalEquipmentCost = equipment.reduce((s, e) => s + e.rental_cost + e.fuel_cost, 0);

  // 5. Labour Cost
  const siteIds = sites.map(s => s.id);
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

  // Calculate Total Spent (Accrued)
  const totalSpent = totalExpenses + totalPurchases + totalEquipmentCost + totalLabourCost;
  const budgetVariance = totalBudget - totalSpent;

  // 6. Cashbook calculations
  let cashIn = 0;
  let cashOut = 0;
  cashbook.forEach(entry => {
    if (entry.type === 'CREDIT') cashIn += entry.amount;
    else if (entry.type === 'DEBIT') cashOut += entry.amount;
  });
  const cashFlow = cashIn - cashOut;

  return ok({
    total_expenses: totalExpenses,
    total_payments: cashOut,
    pending_payments: 0,
    total_invoiced: 0,
    receivable: 0,
    payable: 0,
    total_budget: totalBudget,
    total_spent: totalSpent,
    budget_variance: budgetVariance,
    revenue: 0,
    profit: 0,
    cash_in: cashIn,
    cash_out: cashOut,
    cash_flow: cashFlow,
    breakdown: {
      materials: totalPurchases,
      labour: totalLabourCost,
      equipment: totalEquipmentCost,
      directExpenses: totalExpenses,
    },
    expense_count: expenses.length,
    invoice_count: invoices,
    payment_count: payments,
  });
});
