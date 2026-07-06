import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/response";

// GET /api/reports?type=attendance|inventory|finance|projects|workforce|vendors
export const GET = withAuth(async (req, user) => {
  const company_id = user.company_id || undefined;
  if (!company_id) {
    return ok({ type: "projects", total: 0, active: 0, completed: 0, projects: [] });
  }

  const url = new URL(req.url);
  const type = url.searchParams.get("type") || "projects";
  const fromDate = url.searchParams.get("from") ? new Date(url.searchParams.get("from")!) : undefined;
  const toDate = url.searchParams.get("to") ? new Date(url.searchParams.get("to")!) : undefined;

  let report: any;

  switch (type) {
    case "attendance":
      report = await generateAttendanceReport(company_id, fromDate, toDate);
      break;
    case "inventory":
      report = await generateInventoryReport(company_id);
      break;
    case "finance":
      report = await generateFinanceReport(company_id, fromDate, toDate);
      break;
    case "projects":
      report = await generateProjectsReport(company_id);
      break;
    case "workforce":
      report = await generateWorkforceReport(company_id);
      break;
    case "vendors":
      report = await generateVendorReport(company_id);
      break;
    default:
      report = await generateProjectsReport(company_id);
  }

  return ok(report);
});

async function generateAttendanceReport(company_id: string, from?: Date, to?: Date) {
  const dateFilter: any = {};
  if (from) dateFilter.gte = from;
  if (to) dateFilter.lte = to;
  const where: any = { site: { company_id } };
  if (Object.keys(dateFilter).length) where.date = dateFilter;

  const attendances = await prisma.workerAttendance.findMany({
    where,
    include: { worker: { select: { name: true, trade: true } } },
  });

  const totalRecords = attendances.length;
  const presentCount = attendances.filter(a => a.status === "PRESENT").length;
  const absentCount = attendances.filter(a => a.status === "ABSENT").length;
  const halfDayCount = attendances.filter(a => a.status === "HALF_DAY").length;
  const lateCount = attendances.filter(a => a.is_late).length;
  const totalOvertime = attendances.reduce((sum, a) => sum + (a.overtime_hours || 0), 0);
  const attendanceRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;

  return {
    type: "attendance",
    total_records: totalRecords,
    present: presentCount,
    absent: absentCount,
    half_day: halfDayCount,
    late: lateCount,
    total_overtime_hours: totalOvertime,
    attendance_rate: attendanceRate,
  };
}

async function generateInventoryReport(company_id: string) {
  const items = await prisma.inventoryItem.findMany({
    where: { company_id },
    include: {
      material: { select: { name: true, unit: true } },
      site: { select: { name: true } },
    },
  });

  const totalItems = items.length;
  const lowStockItems = items.filter(i => i.quantity <= i.min_quantity);
  const totalValue = items.reduce((sum, i) => sum + i.quantity, 0);

  // Get last 30 days transactions
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const transactions = await prisma.inventoryTransaction.findMany({
    where: {
      item: { company_id },
      created_at: { gte: thirtyDaysAgo }
    },
  });

  const totalIn = transactions.filter(t => t.type === "IN").reduce((s, t) => s + t.quantity, 0);
  const totalOut = transactions.filter(t => t.type === "OUT").reduce((s, t) => s + t.quantity, 0);

  return {
    type: "inventory",
    total_items: totalItems,
    low_stock_count: lowStockItems.length,
    low_stock_items: lowStockItems.map(i => ({
      material: i.material?.name,
      site: i.site?.name,
      quantity: i.quantity,
      min_quantity: i.min_quantity,
    })),
    total_stock_in_30d: totalIn,
    total_stock_out_30d: totalOut,
    consumption_rate: totalOut / 30,
  };
}

async function generateFinanceReport(company_id: string, from?: Date, to?: Date) {
  const dateFilter: any = {};
  if (from) dateFilter.gte = from;
  if (to) dateFilter.lte = to;

  const expenseWhere: any = { company_id };
  if (Object.keys(dateFilter).length) expenseWhere.date = dateFilter;

  const paymentWhere: any = { company_id };
  if (Object.keys(dateFilter).length) paymentWhere.date = dateFilter;

  const invoiceWhere: any = { company_id };
  if (Object.keys(dateFilter).length) invoiceWhere.due_date = dateFilter;

  const expenses = await prisma.expense.findMany({ where: expenseWhere });
  const payments = await prisma.payment.findMany({ where: paymentWhere });
  const invoices = await prisma.invoice.findMany({ where: invoiceWhere });

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalPayments = payments.reduce((s, p) => s + p.amount, 0);
  const pendingExpenses = expenses.filter(e => e.status === "PENDING").reduce((s, e) => s + e.amount, 0);
  const approvedExpenses = expenses.filter(e => e.status === "APPROVED").reduce((s, e) => s + e.amount, 0);
  const receivable = invoices.filter(i => i.status !== "PAID" && i.status !== "CANCELLED").reduce((s, i) => s + i.total, 0);
  const payable = expenses.filter(e => e.status === "APPROVED").reduce((s, e) => s + e.amount, 0);

  // Category-wise breakdown
  const byCategory: Record<string, number> = {};
  expenses.forEach(e => {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
  });

  return {
    type: "finance",
    total_expenses: totalExpenses,
    total_payments: totalPayments,
    pending_expenses: pendingExpenses,
    approved_expenses: approvedExpenses,
    receivable,
    payable,
    cash_flow: totalPayments - totalExpenses,
    by_category: Object.entries(byCategory).map(([category, amount]) => ({ category, amount })),
  };
}

async function generateProjectsReport(company_id: string) {
  const projects = await prisma.project.findMany({
    where: { company_id },
    include: {
      _count: { select: { sites: true, tasks: true, milestones: true } },
      tasks: { select: { status: true } },
      milestones: { select: { status: true } },
    },
  });

  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === "ACTIVE").length;
  const completedProjects = projects.filter(p => p.status === "COMPLETED").length;

  const projectDetails = projects.map(p => {
    const totalTasks = p.tasks.length;
    const completedTasks = p.tasks.filter(t => t.status === "DONE").length;
    const taskCompletion = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const delayDays = p.end_date
      ? Math.max(0, Math.round((new Date().getTime() - new Date(p.end_date).getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    const budgetVariance = (p.budget || 0) - (p.actual_cost || 0);

    return {
      id: p.id,
      name: p.name,
      status: p.status,
      progress: p.progress_percentage,
      task_completion: taskCompletion,
      total_tasks: totalTasks,
      completed_tasks: completedTasks,
      sites: p._count.sites,
      milestones: p._count.milestones,
      delay_days: delayDays,
      budget: p.budget,
      actual_cost: p.actual_cost,
      budget_variance: budgetVariance,
    };
  });

  return {
    type: "projects",
    total: totalProjects,
    active: activeProjects,
    completed: completedProjects,
    avg_progress: Math.round(projects.reduce((s, p) => s + (p.progress_percentage || 0), 0) / (totalProjects || 1)),
    projects: projectDetails,
  };
}

async function generateWorkforceReport(company_id: string) {
  const workers = await prisma.worker.findMany({
    where: { company_id },
    select: { id: true, name: true, trade: true, status: true, daily_rate: true, site_id: true },
  });

  const totalWorkers = workers.length;
  const activeWorkers = workers.filter(w => w.status === "ACTIVE").length;
  const assignedWorkers = workers.filter(w => w.site_id).length;

  // Trade-wise breakdown
  const byTrade: Record<string, number> = {};
  workers.forEach(w => {
    byTrade[w.trade] = (byTrade[w.trade] || 0) + 1;
  });

  const totalDailyWage = workers
    .filter(w => w.status === "ACTIVE" && w.daily_rate)
    .reduce((s, w) => s + (w.daily_rate || 0), 0);

  return {
    type: "workforce",
    total_workers: totalWorkers,
    active_workers: activeWorkers,
    assigned_to_sites: assignedWorkers,
    unassigned: activeWorkers - assignedWorkers,
    utilization_rate: activeWorkers > 0 ? Math.round((assignedWorkers / activeWorkers) * 100) : 0,
    total_daily_wage: totalDailyWage,
    estimated_monthly_wage: totalDailyWage * 26, // 26 working days
    by_trade: Object.entries(byTrade).map(([trade, count]) => ({ trade, count })),
  };
}

async function generateVendorReport(company_id: string) {
  const vendors = await prisma.vendor.findMany({
    where: { company_id },
    include: {
      _count: { select: { invoices: true, payments: true } },
      ratings: { select: { score: true } },
      payments: { select: { amount: true, status: true } },
    },
  });

  return {
    type: "vendors",
    total_vendors: vendors.length,
    active_vendors: vendors.filter(v => v.is_active).length,
    vendors: vendors.map(v => {
      const avgRating = v.ratings.length > 0
        ? Math.round(v.ratings.reduce((s, r) => s + r.score, 0) / v.ratings.length * 10) / 10
        : null;
      const totalPaid = v.payments
        .filter(p => p.status === "COMPLETED")
        .reduce((s, p) => s + p.amount, 0);

      return {
        id: v.id,
        name: v.name,
        type: v.type,
        category: v.category,
        invoices: v._count.invoices,
        payments: v._count.payments,
        total_paid: totalPaid,
        avg_rating: avgRating,
      };
    }),
  };
}
