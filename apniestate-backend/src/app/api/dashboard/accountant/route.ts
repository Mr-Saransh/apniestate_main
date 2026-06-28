import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/response";

export const GET = withAuth(async (req: NextRequest, user) => {
  const dbUser = await prisma.user.findUnique({ where: { id: user.sub }, select: { company_id: true } });
  const company_id = dbUser?.company_id || undefined;

  if (!company_id) {
    return ok({
      overview: { totalExpenses: 0, totalRevenue: 0, cashBalance: 0, pendingInvoices: 0, pendingPayments: 0, budgetUtilization: 0 },
      cashFlowTrend: [],
      expensesByCategory: [],
      invoiceBreakdown: { draft: 0, sent: 0, paid: 0, overdue: 0, cancelled: 0 },
      vendorPayments: [],
      purchaseOrderBreakdown: { draft: 0, pending: 0, approved: 0, delivered: 0 },
      budgetUtilization: [],
      outstandingPayments: [],
      monthlyExpenses: [],
      recentActivities: []
    });
  }

  // Cashbook summary
  const cashbook = await prisma.cashbook.findMany({ where: { company_id } });
  let totalCredit = 0, totalDebit = 0;
  for (const entry of cashbook) {
    if (entry.type === "CREDIT") totalCredit += entry.amount;
    else totalDebit += entry.amount;
  }

  // Expenses
  const expenses = await prisma.expense.findMany({ where: { company_id } });
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  // Expense by category
  const catMap: Record<string, number> = {};
  for (const e of expenses) {
    catMap[e.category] = (catMap[e.category] || 0) + e.amount;
  }
  const expensesByCategory = Object.entries(catMap).map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount);

  // Invoices
  const invoices = await prisma.invoice.findMany({ where: { company_id } });
  const invoiceBreakdown = { draft: 0, sent: 0, paid: 0, overdue: 0, cancelled: 0 };
  let pendingInvoiceAmount = 0;
  for (const inv of invoices) {
    const key = inv.status.toLowerCase() as keyof typeof invoiceBreakdown;
    if (key in invoiceBreakdown) invoiceBreakdown[key]++;
    if (inv.status === "SENT" || inv.status === "OVERDUE") pendingInvoiceAmount += inv.total;
  }

  // Payments
  const payments = await prisma.payment.findMany({
    where: { company_id },
    include: { vendor: { select: { name: true } } },
    orderBy: { date: "desc" }
  });
  const pendingPayments = payments.filter(p => p.status === "PENDING").reduce((s, p) => s + p.amount, 0);

  // Vendor payments summary (top vendors)
  const vendorPayMap: Record<string, { name: string; total: number; count: number }> = {};
  for (const p of payments) {
    if (p.vendor) {
      const key = p.vendor_id || "unknown";
      if (!vendorPayMap[key]) vendorPayMap[key] = { name: p.vendor.name, total: 0, count: 0 };
      vendorPayMap[key].total += p.amount;
      vendorPayMap[key].count++;
    }
  }
  const vendorPayments = Object.values(vendorPayMap).sort((a, b) => b.total - a.total).slice(0, 8);

  // Purchase Orders
  const pos = await prisma.purchaseOrder.findMany({ where: { company_id } });
  const purchaseOrderBreakdown = { draft: 0, pending: 0, approved: 0, delivered: 0 };
  for (const po of pos) {
    if (po.status === "DRAFT") purchaseOrderBreakdown.draft++;
    else if (po.status === "PENDING") purchaseOrderBreakdown.pending++;
    else if (po.status === "APPROVED" || po.status === "SENT") purchaseOrderBreakdown.approved++;
    else if (po.status === "DELIVERED") purchaseOrderBreakdown.delivered++;
  }

  // Budgets
  const budgets = await prisma.budget.findMany({
    where: { company_id },
    include: { project: { select: { name: true } } }
  });
  const budgetMap: Record<string, { projectName: string; allocated: number; spent: number }> = {};
  for (const b of budgets) {
    const key = b.project_id;
    if (!budgetMap[key]) budgetMap[key] = { projectName: b.project.name, allocated: 0, spent: 0 };
    budgetMap[key].allocated += b.allocated;
    budgetMap[key].spent += b.spent;
  }
  const budgetUtilization = Object.values(budgetMap).map(b => ({
    ...b,
    utilization: b.allocated > 0 ? Math.round((b.spent / b.allocated) * 100) : 0
  }));
  const totalAllocated = budgetUtilization.reduce((s, b) => s + b.allocated, 0);
  const totalSpent = budgetUtilization.reduce((s, b) => s + b.spent, 0);
  const overallBudgetUtil = totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0;

  // Monthly expenses (last 6 months)
  const monthlyExpenses: any[] = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const year = date.getFullYear();
    const month = date.getMonth();
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 1);
    const monthLabel = date.toLocaleDateString("en-US", { month: "short" });

    const monthExpenses = expenses.filter(e => e.date >= monthStart && e.date < monthEnd);
    const monthCredits = cashbook.filter(e => e.type === "CREDIT" && e.date >= monthStart && e.date < monthEnd);
    const monthDebits = cashbook.filter(e => e.type === "DEBIT" && e.date >= monthStart && e.date < monthEnd);

    monthlyExpenses.push({
      month: monthLabel,
      expenses: monthExpenses.reduce((s, e) => s + e.amount, 0),
      credits: monthCredits.reduce((s, e) => s + e.amount, 0),
      debits: monthDebits.reduce((s, e) => s + e.amount, 0)
    });
  }

  // Outstanding payments
  const outstandingPayments = payments
    .filter(p => p.status === "PENDING")
    .slice(0, 8)
    .map(p => ({
      id: p.id,
      amount: p.amount,
      vendor: p.vendor?.name || "Unknown",
      date: p.date.toISOString(),
      method: p.method
    }));

  // Recent activities
  const recentActivities = await prisma.activityLog.findMany({
    where: { company_id },
    include: { user: { select: { name: true } } },
    orderBy: { created_at: "desc" },
    take: 8
  });

  return ok({
    overview: {
      totalExpenses,
      totalRevenue: totalCredit,
      cashBalance: totalCredit - totalDebit,
      pendingInvoices: pendingInvoiceAmount,
      pendingPayments,
      budgetUtilization: overallBudgetUtil
    },
    cashFlowTrend: monthlyExpenses,
    expensesByCategory,
    invoiceBreakdown,
    vendorPayments,
    purchaseOrderBreakdown,
    budgetUtilization,
    outstandingPayments,
    monthlyExpenses,
    recentActivities: recentActivities.map(a => ({
      id: a.id,
      action: a.action,
      entityType: a.entity_type,
      timestamp: a.created_at.toISOString(),
      userName: a.user?.name || "System"
    }))
  });
});
