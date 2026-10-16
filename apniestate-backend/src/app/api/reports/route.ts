import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/response";

// GET /api/reports?type=attendance|inventory|finance|projects|workforce|vendors&project_id=...&from=...&to=...
export const GET = withAuth(async (req, user) => {
  const company_id = user.company_id || undefined;
  if (!company_id) {
    return ok({ type: "projects", total: 0, active: 0, completed: 0, projects: [] });
  }

  const url = new URL(req.url);
  const type = url.searchParams.get("type") || "projects";
  const projectId = url.searchParams.get("project_id") || undefined;
  const fromParam = url.searchParams.get("from") || url.searchParams.get("start_date");
  const toParam = url.searchParams.get("to") || url.searchParams.get("end_date");

  // Parse start of fromDate (00:00:00.000) and end of toDate (23:59:59.999) safely
  let fromDate: Date | undefined;
  let toDate: Date | undefined;

  if (fromParam) {
    const d = new Date(fromParam);
    if (!isNaN(d.getTime())) {
      d.setHours(0, 0, 0, 0);
      fromDate = d;
    }
  }

  if (toParam) {
    const d = new Date(toParam);
    if (!isNaN(d.getTime())) {
      d.setHours(23, 59, 59, 999);
      toDate = d;
    }
  }

  let report: any;

  switch (type) {
    case "attendance":
      report = await generateAttendanceReport(company_id, projectId, fromDate, toDate);
      break;
    case "inventory":
      report = await generateInventoryReport(company_id, projectId, fromDate, toDate);
      break;
    case "finance":
      report = await generateFinanceReport(company_id, projectId, fromDate, toDate);
      break;
    case "projects":
      report = await generateProjectsReport(company_id, projectId, fromDate, toDate);
      break;
    case "workforce":
      report = await generateWorkforceReport(company_id, projectId, fromDate, toDate);
      break;
    case "vendors":
      report = await generateVendorReport(company_id, projectId, fromDate, toDate);
      break;
    default:
      report = await generateProjectsReport(company_id, projectId, fromDate, toDate);
  }

  return ok(report);
});

async function generateAttendanceReport(company_id: string, projectId?: string, from?: Date, to?: Date) {
  let siteIds: string[] = [];
  if (projectId) {
    const sites = await prisma.site.findMany({ where: { project_id: projectId }, select: { id: true } });
    siteIds = sites.map(s => s.id);
  }

  const dateFilter: any = {};
  if (from) dateFilter.gte = from;
  if (to) dateFilter.lte = to;

  // 1. Worker Attendance
  const attWhere: any = {};
  if (siteIds.length > 0) {
    attWhere.site_id = { in: siteIds };
  } else {
    attWhere.site = { company_id };
  }
  if (Object.keys(dateFilter).length) attWhere.date = dateFilter;

  const attendances = await prisma.workerAttendance.findMany({
    where: attWhere,
    include: { worker: { select: { name: true, trade: true } } },
  });

  // 2. Labour Logs (Category-wise attendance & daily costs)
  const logWhere: any = {};
  if (siteIds.length > 0) {
    logWhere.site_id = { in: siteIds };
  } else {
    logWhere.category = { company_id };
  }
  if (Object.keys(dateFilter).length) logWhere.date = dateFilter;

  const labourLogs = await prisma.labourLog.findMany({
    where: logWhere,
    include: { category: true },
    orderBy: { date: 'asc' },
  });

  let totalRecords = attendances.length;
  let presentCount = attendances.filter(a => a.status === "PRESENT").length;
  let absentCount = attendances.filter(a => a.status === "ABSENT").length;
  let halfDayCount = attendances.filter(a => a.status === "HALF_DAY").length;
  let lateCount = attendances.filter(a => a.is_late).length;
  let totalOvertime = attendances.reduce((sum, a) => sum + (a.overtime_hours || 0), 0);

  // If labourLogs exist, incorporate their counts & cost
  let totalLabourCost = 0;
  const categoryStats: Record<string, { name: string; present: number; halfDay: number; otHours: number; cost: number }> = {};

  labourLogs.forEach(log => {
    const catName = log.category?.name || 'General Labour';
    const catCost = log.total_cost || 0;
    totalLabourCost += catCost;

    if (!categoryStats[catName]) {
      categoryStats[catName] = { name: catName, present: 0, halfDay: 0, otHours: 0, cost: 0 };
    }
    categoryStats[catName].present += log.present_count;
    categoryStats[catName].halfDay += log.half_day_count;
    categoryStats[catName].otHours += log.ot_hours;
    categoryStats[catName].cost += catCost;
  });

  const totalLogMen = labourLogs.reduce((sum, l) => sum + l.present_count + l.half_day_count, 0);
  const totalLogOT = labourLogs.reduce((sum, l) => sum + l.ot_hours, 0);

  // If worker attendance wasn't logged per-worker, use the aggregated daily logs
  if (totalRecords === 0 && totalLogMen > 0) {
    totalRecords = totalLogMen;
    presentCount = labourLogs.reduce((sum, l) => sum + l.present_count, 0);
    halfDayCount = labourLogs.reduce((sum, l) => sum + l.half_day_count, 0);
    totalOvertime = totalLogOT;
  }

  const attendanceRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : (totalLogMen > 0 ? 100 : 0);

  return {
    type: "attendance",
    total_records: totalRecords,
    present: presentCount,
    absent: absentCount,
    half_day: halfDayCount,
    late: lateCount,
    total_overtime_hours: totalOvertime,
    attendance_rate: attendanceRate,
    total_labour_cost: totalLabourCost,
    categories: Object.values(categoryStats),
    from: from ? from.toISOString() : null,
    to: to ? to.toISOString() : null,
  };
}

async function generateInventoryReport(company_id: string, projectId?: string, from?: Date, to?: Date) {
  let siteIds: string[] = [];
  if (projectId) {
    const sites = await prisma.site.findMany({ where: { project_id: projectId }, select: { id: true } });
    siteIds = sites.map(s => s.id);
  }

  const itemWhere: any = siteIds.length > 0 ? { site_id: { in: siteIds } } : { company_id };

  const items = await prisma.inventoryItem.findMany({
    where: itemWhere,
    include: {
      material: { select: { name: true, unit: true } },
      site: { select: { name: true } },
    },
  });

  const totalItems = items.length;
  const lowStockItems = items.filter(i => i.quantity <= i.min_quantity);

  // Date range for transactions
  const txWhere: any = siteIds.length > 0 ? { item: { site_id: { in: siteIds } } } : { item: { company_id } };
  if (from || to) {
    txWhere.created_at = {};
    if (from) txWhere.created_at.gte = from;
    if (to) txWhere.created_at.lte = to;
  } else {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    txWhere.created_at = { gte: thirtyDaysAgo };
  }

  const transactions = await prisma.inventoryTransaction.findMany({
    where: txWhere,
  });

  const totalIn = transactions.filter(t => t.type === "IN").reduce((s, t) => s + t.quantity, 0);
  const totalOut = transactions.filter(t => t.type === "OUT").reduce((s, t) => s + t.quantity, 0);

  // Determine span days for consumption rate
  let spanDays = 30;
  if (from && to) {
    spanDays = Math.max(1, Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)));
  }

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
    consumption_rate: totalOut / spanDays,
    from: from ? from.toISOString() : null,
    to: to ? to.toISOString() : null,
  };
}

async function generateFinanceReport(company_id: string, projectId?: string, from?: Date, to?: Date) {
  const dateFilter: any = {};
  if (from) dateFilter.gte = from;
  if (to) dateFilter.lte = to;

  const expenseWhere: any = projectId ? { project_id: projectId } : { company_id };
  if (Object.keys(dateFilter).length) expenseWhere.date = dateFilter;

  const paymentWhere: any = projectId ? { invoice: { project_id: projectId } } : { company_id };
  if (Object.keys(dateFilter).length) paymentWhere.date = dateFilter;

  const invoiceWhere: any = projectId ? { project_id: projectId } : { company_id };
  if (Object.keys(dateFilter).length) invoiceWhere.due_date = dateFilter;

  const [expenses, payments, invoices] = await Promise.all([
    prisma.expense.findMany({ where: expenseWhere }),
    prisma.payment.findMany({ where: paymentWhere }),
    prisma.invoice.findMany({ where: invoiceWhere }),
  ]);

  // Labour log costs in range
  let labourCost = 0;
  if (projectId) {
    const sites = await prisma.site.findMany({ where: { project_id: projectId }, select: { id: true } });
    const logWhere: any = { site_id: { in: sites.map(s => s.id) } };
    if (Object.keys(dateFilter).length) logWhere.date = dateFilter;
    const labourLogs = await prisma.labourLog.findMany({ where: logWhere });
    labourCost = labourLogs.reduce((s, l) => s + (l.total_cost || 0), 0);
  }

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0) + labourCost;
  const totalPayments = payments.reduce((s, p) => s + p.amount, 0);
  const pendingExpenses = expenses.filter(e => e.status === "PENDING").reduce((s, e) => s + e.amount, 0);
  const approvedExpenses = expenses.filter(e => e.status === "APPROVED").reduce((s, e) => s + e.amount, 0) + labourCost;
  const receivable = invoices.filter(i => i.status !== "PAID" && i.status !== "CANCELLED").reduce((s, i) => s + i.total, 0);
  const payable = approvedExpenses;

  // Category-wise breakdown
  const byCategory: Record<string, number> = {};
  expenses.forEach(e => {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
  });
  if (labourCost > 0) {
    byCategory['Labour & Wages'] = (byCategory['Labour & Wages'] || 0) + labourCost;
  }

  return {
    type: "finance",
    total_expenses: totalExpenses,
    total_payments: totalPayments,
    total_labour_cost: labourCost,
    pending_expenses: pendingExpenses,
    approved_expenses: approvedExpenses,
    receivable,
    payable,
    cash_flow: totalPayments - totalExpenses,
    by_category: Object.entries(byCategory).map(([category, amount]) => ({ category, amount })),
    from: from ? from.toISOString() : null,
    to: to ? to.toISOString() : null,
  };
}

async function generateProjectsReport(company_id: string, projectId?: string, from?: Date, to?: Date) {
  const where: any = { company_id };
  if (projectId) where.id = projectId;

  const projects = await prisma.project.findMany({
    where,
    include: {
      _count: { select: { sites: true, tasks: true, milestones: true } },
      tasks: { select: { status: true, created_at: true } },
      milestones: { select: { status: true, target_date: true } },
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
    from: from ? from.toISOString() : null,
    to: to ? to.toISOString() : null,
  };
}

async function generateWorkforceReport(company_id: string, projectId?: string, from?: Date, to?: Date) {
  let siteIds: string[] = [];
  if (projectId) {
    const sites = await prisma.site.findMany({ where: { project_id: projectId }, select: { id: true } });
    siteIds = sites.map(s => s.id);
  }

  const workerWhere: any = siteIds.length > 0 ? { site_id: { in: siteIds } } : { company_id };

  const workers = await prisma.worker.findMany({
    where: workerWhere,
    select: { id: true, name: true, trade: true, status: true, daily_rate: true, site_id: true },
  });

  const totalWorkers = workers.length;
  const activeWorkers = workers.filter(w => w.status === "ACTIVE").length;
  const assignedWorkers = workers.filter(w => w.site_id).length;

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
    estimated_monthly_wage: totalDailyWage * 26,
    by_trade: Object.entries(byTrade).map(([trade, count]) => ({ trade, count })),
    from: from ? from.toISOString() : null,
    to: to ? to.toISOString() : null,
  };
}

async function generateVendorReport(company_id: string, projectId?: string, from?: Date, to?: Date) {
  const vendors = await prisma.vendor.findMany({
    where: { company_id },
    include: {
      _count: { select: { invoices: true, payments: true } },
      ratings: { select: { score: true } },
      payments: { select: { amount: true, status: true, created_at: true } },
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
    from: from ? from.toISOString() : null,
    to: to ? to.toISOString() : null,
  };
}
