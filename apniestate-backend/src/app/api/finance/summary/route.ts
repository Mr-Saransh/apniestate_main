import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/response";

// GET /api/finance/summary — Overall finance summary with computed formulas
export const GET = withAuth(async () => {
  const [expenses, payments, invoices, budgets] = await Promise.all([
    prisma.expense.findMany(),
    prisma.payment.findMany(),
    prisma.invoice.findMany(),
    prisma.budget.findMany(),
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
