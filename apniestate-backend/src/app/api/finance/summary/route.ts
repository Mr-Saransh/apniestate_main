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

  // 1. Fetch Budget from Project directly
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { budget: true }
  });
  
  let totalBudget = project?.budget || 0;
  
  if (totalBudget === 0) {
    const budgets = await prisma.budget.findMany({ where: { project_id: projectId } });
    totalBudget = budgets.reduce((s, b) => s + b.allocated, 0);
  }

  // 2. Fetch Direct Expenses
  const expenses = await prisma.expense.findMany({ where: { project_id: projectId } });
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  // 3. Fetch Purchases (Approved POs for this project)
  const pos = await prisma.purchaseOrder.findMany({ 
    where: { project_id: projectId, status: { in: ['APPROVED', 'SENT'] } } 
  });
  const totalPurchases = pos.reduce((s, p) => s + p.total_amount, 0);

  // 4. Fetch Equipment Cost
  // We'll calculate the cost of equipment currently assigned to the project (simplification).
  const equipment = await prisma.equipment.findMany({ where: { project_id: projectId } });
  const totalEquipmentCost = equipment.reduce((s, e) => s + e.rental_cost + e.fuel_cost, 0);

  // 5. Fetch Labour Cost
  // We need to fetch sites for this project, then Labour Logs, and join with Labour Category
  const sites = await prisma.site.findMany({ where: { project_id: projectId } });
  const siteIds = sites.map(s => s.id);
  
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

  // Calculate Total Spent (Accrued)
  const totalSpent = totalExpenses + totalPurchases + totalEquipmentCost + totalLabourCost;
  const budgetVariance = totalBudget - totalSpent;

  // 6. Cashbook logic
  const cashbook = await prisma.cashbook.findMany({ where: { project_id: projectId } });
  let cashIn = 0;
  let cashOut = 0;
  cashbook.forEach(entry => {
    if (entry.type === 'CREDIT') cashIn += entry.amount;
    else if (entry.type === 'DEBIT') cashOut += entry.amount;
  });
  const cashFlow = cashIn - cashOut;

  // 7. Payments and Invoices for counts
  // Assuming invoices/payments are linked to company and not project directly, or they are via vendor.
  // We'll leave them as 0 for project-scoped summary if they aren't linked.
  const payments = await prisma.payment.count(); 
  const invoices = await prisma.invoice.count();

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
    cash_flow: cashFlow,
    expense_count: expenses.length,
    invoice_count: invoices,
    payment_count: payments,
  });
});
