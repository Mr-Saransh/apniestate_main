import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/response";
import {
  calculateProjectProgress,
  calculateSiteHealthScore,
  calculateProjectRiskScore
} from "@/lib/engines";

export const GET = withAuth(async (req: NextRequest, user) => {
  const dbUser = await prisma.user.findUnique({
    where: { id: user.sub }
  });

  const company_id = dbUser?.company_id || undefined;

  if (!company_id) {
    return ok({
      overview: {
        totalProjects: 0,
        activeSites: 0,
        completedProjects: 0,
        delayedProjects: 0,
        todayLabourCost: 0,
        currentCashBalance: 0,
        budgetUtilization: 0
      },
      alerts: [],
      projectIntelligence: [],
      financialIntelligence: {
        creditSum: 0,
        debitSum: 0,
        recentExpenses: []
      },
      workforceIntelligence: {
        present: 0,
        absent: 0
      },
      calendarEvents: [],
      revenueTrend: [],
      budgetBurn: [],
      vendorPerformance: [],
      upcomingMilestones: [],
      materialShortages: [],
      labourTrend: [],
      approvalsPending: { total: 0, expenses: 0, leaves: 0, materialRequests: 0 }
    });
  }

  // 1. Fetch Projects & Sites under this company
  const projects = await prisma.project.findMany({
    where: { company_id },
    include: { sites: true }
  });

  const totalProjects = projects.length;
  const completedProjects = projects.filter(p => p.status === "COMPLETED").length;
  
  const sites = await prisma.site.findMany({
    where: { company_id }
  });
  const activeSites = sites.filter(s => s.status === "IN_PROGRESS").length;

  // 2. Timelines & Budgets
  let totalAllocated = 0;
  const budgets = await prisma.budget.findMany({
    where: { company_id }
  });
  for (const b of budgets) {
    totalAllocated += b.allocated;
  }

  let totalSpent = 0;
  const expenses = await prisma.expense.findMany({
    where: { company_id, status: "APPROVED" }
  });
  for (const e of expenses) {
    totalSpent += e.amount;
  }

  const budgetUtilization = totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0;

  // 3. Cashbook Float Balance
  const cashbookEntries = await prisma.cashbook.findMany({
    where: { company_id }
  });
  let creditSum = 0;
  let debitSum = 0;
  for (const entry of cashbookEntries) {
    if (entry.type === "CREDIT") {
      creditSum += entry.amount;
    } else {
      debitSum += entry.amount;
    }
  }
  const currentCashBalance = creditSum - debitSum;

  // 4. Labour wages today
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const todayAttendances = await prisma.workerAttendance.findMany({
    where: {
      site: { company_id },
      date: today,
      status: "PRESENT"
    },
    include: { worker: true }
  });

  let todayLabourCost = 0;
  for (const att of todayAttendances) {
    todayLabourCost += att.daily_wage_snapshot || att.worker.daily_rate || 0;
  }

  // 5. Generate Alerts dynamically
  const alerts: any[] = [];

  // Low stock inventory alert
  const lowStockItems = await prisma.inventoryItem.findMany({
    where: {
      site: { company_id },
      quantity: { lte: prisma.inventoryItem.fields.min_quantity }
    },
    include: { material: true, site: true }
  });

  for (const item of lowStockItems) {
    alerts.push({
      type: "LOW_STOCK",
      title: `Low Stock: ${item.material.name}`,
      description: `Qty is ${item.quantity} ${item.material.unit} at site ${item.site.name}. Min required: ${item.min_quantity}`,
      link: `/inventory`,
      severity: "error"
    });
  }

  // Overdue milestones alert
  const pendingMilestones = await prisma.milestone.findMany({
    where: {
      project: { company_id },
      status: { not: "COMPLETED" },
      target_date: { lt: new Date() }
    },
    include: { project: true }
  });
  for (const m of pendingMilestones) {
    alerts.push({
      type: "DELAYED_MILESTONE",
      title: `Overdue milestone: ${m.name}`,
      description: `Target date was ${m.target_date.toLocaleDateString()} for project ${m.project.name}`,
      link: `/projects?project_id=${m.project_id}`,
      severity: "warning"
    });
  }

  // 6. Project Intelligence Cards
  const projectIntelligence: any[] = [];
  let delayedProjects = 0;

  for (const project of projects) {
    const progress = await calculateProjectProgress(project.id);
    const riskScore = await calculateProjectRiskScore(project.id);
    
    // Average health score of project sites
    let healthSum = 0;
    const projectSites = project.sites;
    for (const site of projectSites) {
      healthSum += await calculateSiteHealthScore(site.id);
    }
    const healthScore = projectSites.length > 0 ? Math.round(healthSum / projectSites.length) : 100;

    const budgetStatus = (project.actual_cost || 0) > (project.budget || 0) && (project.budget || 0) > 0 
      ? "OVER_BUDGET" 
      : "ON_TRACK";

    let timelineStatus = "ON_SCHEDULE";
    const hasDelayedMilestone = pendingMilestones.some(m => m.project_id === project.id);
    if (hasDelayedMilestone) {
      timelineStatus = "DELAYED";
      delayedProjects++;
    }

    projectIntelligence.push({
      id: project.id,
      name: project.name,
      progress,
      status: project.status,
      timelineStatus,
      budgetStatus,
      riskScore,
      healthScore
    });
  }

  // 7. Recent Financial Activity
  const recentExpenses = await prisma.expense.findMany({
    where: { company_id },
    orderBy: { date: "desc" },
    take: 5
  });

  const financialIntelligence = {
    creditSum,
    debitSum,
    recentExpenses: recentExpenses.map(e => ({
      id: e.id,
      category: e.category,
      amount: e.amount,
      description: e.description,
      date: e.date.toISOString(),
      status: e.status
    }))
  };

  // 8. Workforce Metrics Today
  const totalWorkers = await prisma.worker.count({
    where: { company_id, is_active: true }
  });
  const presentWorkersCount = todayAttendances.length;
  const workforceIntelligence = {
    present: presentWorkersCount,
    absent: Math.max(0, totalWorkers - presentWorkersCount)
  };

  // 9. Construction Calendar Events
  const calendarEvents: any[] = [];
  
  const allMilestones = await prisma.milestone.findMany({
    where: { project: { company_id } },
    include: { project: true }
  });
  for (const m of allMilestones) {
    calendarEvents.push({
      id: `milestone-${m.id}`,
      title: `Milestone: ${m.name} (${m.project.name})`,
      start: m.target_date,
      type: "MILESTONE"
    });
  }

  const allPOs = await prisma.purchaseOrder.findMany({
    where: { project: { company_id } },
    include: { project: true }
  });
  for (const po of allPOs) {
    calendarEvents.push({
      id: `po-${po.id}`,
      title: `Delivery: PO #${po.po_number || po.id.slice(0,6)} (${po.project?.name || "Unknown Project"})`,
      start: po.delivery_date || po.created_at,
      type: "DELIVERY"
    });
  }

  // 10. ENRICHMENT FOR MILESTONE 16 & 17
  // Revenue Trend (Cashbook credits vs debits, last 6 months)
  const revenueTrend: any[] = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const y = date.getFullYear();
    const m = date.getMonth();
    const start = new Date(y, m, 1);
    const end = new Date(y, m + 1, 1);
    const monthLabel = date.toLocaleDateString("en-US", { month: "short" });

    const monthCredits = cashbookEntries.filter(c => c.date >= start && c.date < end && c.type === "CREDIT").reduce((s, c) => s + c.amount, 0);
    const monthDebits = cashbookEntries.filter(c => c.date >= start && c.date < end && c.type === "DEBIT").reduce((s, c) => s + c.amount, 0);

    revenueTrend.push({
      month: monthLabel,
      revenue: monthCredits,
      expenses: monthDebits
    });
  }

  // Budget Burn Chart data per project
  const budgetBurn = projects.map(p => {
    const projBudgets = budgets.filter(b => b.project_id === p.id);
    const allocated = projBudgets.reduce((s, b) => s + b.allocated, 0);
    const spent = projBudgets.reduce((s, b) => s + b.spent, 0);
    return {
      projectName: p.name,
      allocated: allocated || p.budget || 0,
      spent: spent || p.actual_cost || 0
    };
  });

  // Vendor Performance (average ratings, active status)
  const vendors = await prisma.vendor.findMany({
    where: { company_id, is_active: true },
    include: { ratings: true },
    take: 5
  });
  const vendorPerformance = vendors.map(v => {
    const avgScore = v.ratings.length > 0 ? Math.round((v.ratings.reduce((s, r) => s + r.score, 0) / v.ratings.length) * 10) / 10 : 4.0;
    return {
      name: v.name,
      type: v.type,
      rating: avgScore
    };
  });

  // Material Shortages
  const materialShortages = lowStockItems.map(item => ({
    name: item.material.name,
    unit: item.material.unit,
    quantity: item.quantity,
    minQuantity: item.min_quantity,
    siteName: item.site.name
  }));

  // Labour trend (last 7 days counts)
  const labourTrend: any[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setUTCHours(0,0,0,0);
    const next = new Date(date);
    next.setDate(next.getDate() + 1);

    const attendances = await prisma.workerAttendance.findMany({
      where: {
        site: { company_id },
        date: date
      },
      include: { worker: true }
    });

    const present = attendances.filter(a => a.status === "PRESENT").length;
    let cost = 0;
    for (const a of attendances.filter(att => att.status === "PRESENT")) {
      cost += a.daily_wage_snapshot || a.worker.daily_rate || 0;
    }

    labourTrend.push({
      date: date.toLocaleDateString("en-US", { weekday: "short" }),
      workers: present,
      cost
    });
  }

  // Upcoming Milestones (next 30 days)
  const thirtyDaysLater = new Date();
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
  const upcomingMilestones = allMilestones
    .filter(m => m.target_date >= new Date() && m.target_date <= thirtyDaysLater && m.status !== "COMPLETED")
    .map(m => ({
      name: m.name,
      projectName: m.project.name,
      targetDate: m.target_date.toISOString(),
      status: m.status
    }));

  // Approvals Pending counts
  const pendingLeaves = await prisma.leave.count({ where: { worker: { company_id }, status: "PENDING" } });
  const pendingExpenses = await prisma.expense.count({ where: { company_id, status: "PENDING" } });
  const pendingMRsCount = await prisma.materialRequest.count({ where: { site: { company_id }, status: "PENDING" } });

  return ok({
    overview: {
      totalProjects,
      activeSites,
      completedProjects,
      delayedProjects,
      todayLabourCost,
      currentCashBalance,
      budgetUtilization
    },
    alerts,
    projectIntelligence,
    financialIntelligence,
    workforceIntelligence,
    calendarEvents,
    revenueTrend,
    budgetBurn,
    vendorPerformance,
    upcomingMilestones,
    materialShortages,
    labourTrend,
    approvalsPending: {
      total: pendingLeaves + pendingExpenses + pendingMRsCount,
      expenses: pendingExpenses,
      leaves: pendingLeaves,
      materialRequests: pendingMRsCount
    }
  });
});
