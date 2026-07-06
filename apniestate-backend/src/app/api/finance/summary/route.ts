import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/response";

// GET /api/finance/summary — Overall finance summary with computed formulas
export const GET = withAuth(async (req, user) => {
  const company_id = user.company_id || undefined;
  if (!company_id) {
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

  const [expenses, payments, invoices, budgets] = await Promise.all([
    prisma.expense.findMany({ where: { company_id } }),
    prisma.payment.findMany({ where: { company_id } }),
    prisma.invoice.findMany({ where: { company_id } }),
    prisma.budget.findMany({ where: { project: { company_id } } }),
  ]);

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalPayments = payments.filter(p => p.status === "COMPLETED").reduce((s, p) => s + p.amount, 0);
  const pendingPayments = payments.filter(p => p.status === "PENDING").reduce((s, p) => s + p.amount, 0);

  const totalInvoiced = invoices.reduce((s, i) => s + i.total, 0);
  const receivable = invoices.filter(i => ["SENT", "OVERDUE"].includes(i.status)).reduce((s, i) => s + i.total, 0);
  const payable = expenses.filter(e => ["APPROVED", "PENDING"].includes(e.status)).reduce((s, e) => s + e.amount, 0);

  const totalBudget = budgets.reduce((s, b) => s + b.allocated, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const budgetVariance = totalBudget - totalSpent;

  const revenue = invoices.filter(i => i.status === "PAID").reduce((s, i) => s + i.total, 0);
  const profit = revenue - totalExpenses;
  const cashFlow = totalPayments - totalExpenses;

  return ok({
    total_expenses: totalExpenses,
    total_payments: totalPayments,
    pending_payments: pendingPayments,
    total_invoiced: totalInvoiced,
    receivable,
    payable,
    total_budget: totalBudget,
    total_spent: totalSpent,
    budget_variance: budgetVariance,
    revenue,
    profit,
    cash_flow: cashFlow,
    expense_count: expenses.length,
    invoice_count: invoices.length,
    payment_count: payments.length,
  });
});
