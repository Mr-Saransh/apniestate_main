// @ts-nocheck
import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/response";
import {
  calculateProjectProgress,
  calculateSiteHealthScore,
  calculateProjectRiskScore,
  calculateMonthlyLabourCost
} from "@/lib/engines";

export const GET = withAuth(async (req: NextRequest, user) => {
  try {
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
        budgetUtilization: 0,
        monthlyLabourCost: 0,
        expectedProfit: 0,
        outstandingPayments: 0,
        equipmentDowntime: 0
      },
      alerts: [],
      decisionCards: [],
      projectIntelligence: [],
      financialIntelligence: {
        creditSum: 0,
        debitSum: 0,
        recentExpenses: [],
        topExpenseCategories: [],
        cashBurnRate: 0,
        profitForecast: 0,
        todayExpenses: 0,
        expectedPayments: 0
      },
      workforceIntelligence: {
        present: 0,
        absent: 0,
        productivityScore: 0,
        costPerWorker: 0
      },
      calendarEvents: [],
      revenueTrend: [],
      budgetBurn: [],
      vendorPerformance: [],
      upcomingMilestones: [],
      materialShortages: [],
      labourTrend: [],
      approvalsPending: { total: 0, expenses: 0, leaves: 0, materialRequests: 0, purchaseOrders: 0 },
      workflowAlerts: {
        projectsWithoutPM: 0,
        projectsWithoutSupervisor: 0,
        pendingInvitations: 0,
        pendingApprovals: 0,
        pendingResignations: 0,
        projectsWithoutBudget: 0,
        sitesWithoutAttendanceToday: 0,
        missingDprToday: 0,
        unassignedProjects: 0,
        inactiveMembers: 0
      }
    });
  }

  // 1. Fetch Projects & Sites under this company
  const projects = await prisma.project.findMany({
    where: { company_id },
    include: { sites: true, manager: true }
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
  const decisionCards: any[] = [];

  // Low stock inventory alert
  const allInventoryItems = await prisma.inventoryItem.findMany({
    where: {
      site: { company_id }
    },
    include: { material: true, site: true }
  });
  const lowStockItems = allInventoryItems.filter(item => item.quantity <= item.min_quantity);

  for (const item of lowStockItems) {
    alerts.push({
      type: "LOW_STOCK",
      title: `Low Stock: ${item.material.name}`,
      description: `Qty is ${item.quantity} ${item.material.unit} at site ${item.site.name}. Min required: ${item.min_quantity}`,
      link: `/inventory`,
      severity: "error"
    });
    // Add Decision Card for critical stock
    if (item.quantity === 0 || (item.quantity < (item.min_quantity * 0.5))) {
      decisionCards.push({
        id: `dec-stock-${item.id}`,
        title: `${item.material.name} stock is critical at ${item.site.name}`,
        reason: `Current stock: ${item.quantity}. Minimum required: ${item.min_quantity}. Operations may halt.`,
        suggestedAction: "Raise a Purchase Request immediately.",
        ctaText: "Create Request",
        ctaLink: "/inventory",
        severity: "error"
      });
    }
  }

  // Overdue milestones alert
  const pendingMilestones = await prisma.milestone.findMany({
    where: {
      project: { company_id },
      status: { not: "COMPLETED" }
    },
    include: { project: true }
  });
  
  for (const m of pendingMilestones) {
    if (m.target_date < new Date()) {
      alerts.push({
        type: "DELAYED_MILESTONE",
        title: `Overdue milestone: ${m.name}`,
        description: `Target date was ${m.target_date.toLocaleDateString()} for project ${m.project.name}`,
        link: `/projects?project_id=${m.project_id}`,
        severity: "warning"
      });
      decisionCards.push({
        id: `dec-milestone-${m.id}`,
        title: `${m.name} milestone is delayed`,
        reason: `Target was ${m.target_date.toLocaleDateString()}. This will affect dependent tasks.`,
        suggestedAction: "Review project timeline and re-allocate workforce.",
        ctaText: "View Timeline",
        ctaLink: `/projects/${m.project_id}`,
        severity: "warning"
      });
    }
  }

  // 6. Project Intelligence Cards
  const projectIntelligence: any[] = [];
  let delayedProjects = 0;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Pre-fetch all related models in bulk queries
  const allMilestonesForCompany = await prisma.milestone.findMany({
    where: { project: { company_id } }
  });

  const allTasksForCompany = await prisma.task.findMany({
    where: { company_id }
  });

  const allAttendancesForCompany = await prisma.workerAttendance.findMany({
    where: { site: { company_id }, date: { gte: sevenDaysAgo } },
    include: { worker: true }
  });

  const allWorkersForCompany = await prisma.worker.findMany({
    where: { company_id, is_active: true }
  });

  const allDprsForCompany = await prisma.dailyReport.findMany({
    where: { company_id, created_at: { gte: sevenDaysAgo } }
  });

  const allProjectAssignments = await prisma.projectAssignment.findMany({
    where: { project: { company_id } }
  });

  // Re-map projects to include project reference for site health calculations
  const projectsWithRefs = projects.map(p => ({
    ...p,
    sites: p.sites.map(s => ({
      ...s,
      project: p
    }))
  }));

  const preFetchedSiteHealthSites = projectsWithRefs.flatMap(p => p.sites);

  for (const project of projectsWithRefs) {
    const progress = await calculateProjectProgress(project.id, allMilestonesForCompany, allTasksForCompany);
    const riskScore = await calculateProjectRiskScore(project.id, {
      project,
      tasks: allTasksForCompany,
      milestones: allMilestonesForCompany
    });
    
    // Average health score of project sites
    let healthSum = 0;
    const projectSites = project.sites;
    for (const site of projectSites) {
      healthSum += await calculateSiteHealthScore(site.id, {
        attendances: allAttendancesForCompany,
        workers: allWorkersForCompany,
        tasks: allTasksForCompany,
        dprs: allDprsForCompany,
        sites: preFetchedSiteHealthSites
      });
    }
    const healthScore = projectSites.length > 0 ? Math.round(healthSum / projectSites.length) : 100;

    const budgetStatus = (project.actual_cost || 0) > (project.budget || 0) && (project.budget || 0) > 0 
      ? "OVER_BUDGET" 
      : "ON_TRACK";

    let timelineStatus = "ON_SCHEDULE";
    const hasDelayedMilestone = pendingMilestones.some(m => m.project_id === project.id && m.target_date < new Date());
    if (hasDelayedMilestone) {
      timelineStatus = "DELAYED";
      delayedProjects++;
    }

    if (budgetStatus === "OVER_BUDGET") {
      decisionCards.push({
        id: `dec-budget-${project.id}`,
        title: `${project.name} is likely to exceed budget`,
        reason: `Spent ₹${project.actual_cost?.toLocaleString()} against budget of ₹${project.budget?.toLocaleString()}.`,
        suggestedAction: "Review cost breakdown and freeze non-essential expenses.",
        ctaText: "View Financials",
        ctaLink: `/projects/${project.id}`,
        severity: "error"
      });
    }

    projectIntelligence.push({
      id: project.id,
      name: project.name,
      client: "Apni Estate Corp", // Fallback for UI if no client field exists
      location: (project as any).location || "N/A",
      progress,
      status: project.status,
      timelineStatus,
      budgetStatus,
      riskScore,
      healthScore,
      budgetUsed: project.actual_cost || 0,
      budgetRemaining: Math.max(0, (project.budget || 0) - (project.actual_cost || 0)),
      expectedFinish: project.end_date?.toISOString(),
      supervisor: project.manager?.name || "Unassigned",
      delayedDays: timelineStatus === "DELAYED" && project.end_date ? Math.max(0, Math.floor((new Date().getTime() - project.end_date.getTime()) / (1000 * 3600 * 24))) : 0,
      riskBreakdown: {
        budget: budgetStatus === "OVER_BUDGET" ? 80 : 20,
        timeline: timelineStatus === "DELAYED" ? 70 : 10,
        material: 30,
        vendor: 15,
        safety: 5
      }
    });
  }

  // 7. Recent Financial Activity & Enhanced Metrics
  const recentExpenses = await prisma.expense.findMany({
    where: { company_id },
    orderBy: { date: "desc" },
    take: 5
  });

  const todayExpenses = expenses.filter(e => {
    const eDate = new Date(e.date);
    return eDate.getFullYear() === today.getFullYear() && eDate.getMonth() === today.getMonth() && eDate.getDate() === today.getDate();
  }).reduce((sum, e) => sum + e.amount, 0);

  const expenseCategories = await prisma.expense.groupBy({
    by: ['category'],
    where: { company_id },
    _sum: { amount: true },
    orderBy: { _sum: { amount: 'desc' } },
    take: 4
  });

  const topExpenseCategories = expenseCategories.map(c => ({
    name: c.category,
    amount: c._sum.amount || 0
  }));

  const pendingInvoicesTotal = await prisma.invoice.aggregate({
    where: { company_id, status: "DRAFT" }, // or PENDING/SENT depending on your logic
    _sum: { total: true }
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
    })),
    topExpenseCategories,
    cashBurnRate: Math.round(totalSpent / 30), // Approx daily burn rate
    profitForecast: creditSum - debitSum, // Net cash flow instead of arbitrary profit forecast
    todayExpenses,
    expectedPayments: pendingInvoicesTotal._sum.total || 0
  };

  // 8. Workforce Metrics Today
  const totalWorkers = await prisma.worker.count({
    where: { company_id, is_active: true }
  });
  const presentWorkersCount = todayAttendances.length;
  const absentCount = Math.max(0, totalWorkers - presentWorkersCount);

  if (absentCount > (totalWorkers * 0.2)) {
    decisionCards.push({
        id: `dec-workforce-absent`,
        title: `${absentCount} workers absent today`,
        reason: `High absenteeism (>${Math.round((absentCount/totalWorkers)*100)}%) detected across active sites.`,
        suggestedAction: "Re-assign available workers to critical path tasks.",
        ctaText: "Manage Workforce",
        ctaLink: `/workers`,
        severity: "warning"
      });
  }

  // Calculate productivity score based on attendance and task completion
  const totalTasks = await prisma.task.count({ where: { company_id } });
  const completedTasks = await prisma.task.count({ where: { company_id, status: "DONE" } });
  const taskCompletionRate = totalTasks > 0 ? completedTasks / totalTasks : 1;
  const attendanceRate = totalWorkers > 0 ? presentWorkersCount / totalWorkers : 1;
  const productivityScore = Math.round((taskCompletionRate * 0.5 + attendanceRate * 0.5) * 100);

  const workforceIntelligence = {
    present: presentWorkersCount,
    absent: absentCount,
    productivityScore: presentWorkersCount > 0 ? productivityScore : 0,
    costPerWorker: presentWorkersCount > 0 ? Math.round(todayLabourCost / presentWorkersCount) : 0
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
      rating: avgScore,
      lateDeliveries: 0, // Will be updated when PO delivery dates vs actual receive dates are tracked
      averageDeliveryTime: 0, // Same as above
      isBlocked: false
    };
  });

  const delayedVendors = vendorPerformance.filter(v => v.lateDeliveries > 1);
  for (const v of delayedVendors) {
    decisionCards.push({
      id: `dec-vendor-${v.name}`,
      title: `Vendor ${v.name} has delayed deliveries`,
      reason: `Recorded ${v.lateDeliveries} late deliveries recently.`,
      suggestedAction: "Contact vendor or consider alternative suppliers.",
      ctaText: "View Vendors",
      ctaLink: `/vendors`,
      severity: "warning"
    });
  }

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

    // Filter in-memory
    const attendances = allAttendancesForCompany.filter(a => {
      const aDate = new Date(a.date);
      return aDate.getFullYear() === date.getFullYear() &&
             aDate.getMonth() === date.getMonth() &&
             aDate.getDate() === date.getDate();
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
  const pendingMRsCount = await prisma.materialRequest.count({ where: { site: { company_id }, status: "SUBMITTED" } });
  const pendingPOsCount = await prisma.purchaseOrder.count({ where: { project: { company_id }, status: "PENDING" } });

  // Add Dynamic Decision Card for pending vendor approvals instead of hardcoded numbers
  const pendingApprovalsTotal = pendingExpenses + pendingMRsCount + pendingPOsCount;
  if (pendingApprovalsTotal > 0) {
    decisionCards.push({
      id: "dec-finance-pending",
      title: `${pendingApprovalsTotal} pending vendor approvals`,
      reason: `You have ${pendingExpenses} expenses, ${pendingMRsCount} material requests, and ${pendingPOsCount} purchase orders waiting for approval.`,
      suggestedAction: "Clear pending approvals to avoid supply chain blocks.",
      ctaText: "Review Approvals",
      ctaLink: "/approvals",
      severity: "warning"
    });
  }

  const monthlyLabourCost = await calculateMonthlyLabourCost(company_id);
  
  const underMaintenanceEquipment = await prisma.equipment.count({
    where: { site: { company_id }, status: "UNDER_MAINTENANCE" }
  });

  // 11. WORKFLOW ALERTS (Phase 5 Sprint 2 - Milestone 12)
  const pendingInvitationsCount = await prisma.invitation.count({ where: { company_id, status: "PENDING" } });
  const pendingApprovalsCount = await prisma.invitation.count({ where: { company_id, status: "ACCEPTED" } });
  const pendingResignationsCount = await prisma.resignation.count({ where: { company_id, status: "PENDING" } });
  const inactiveMembersCount = await prisma.companyMembership.count({ where: { company_id, status: "INACTIVE" } });
  
  let projectsWithoutPM = 0;
  let unassignedProjects = 0;
  let projectsWithoutBudgetCount = 0;
  
  for (const p of projects) {
    if (!p.manager_id) projectsWithoutPM++;
    
    // Filter in-memory
    const projAssignmentsCount = allProjectAssignments.filter(a => a.project_id === p.id).length;
    if (projAssignmentsCount === 0) unassignedProjects++;
    
    const projBudgets = budgets.filter(b => b.project_id === p.id);
    if (projBudgets.length === 0) projectsWithoutBudgetCount++;
  }

  let projectsWithoutSupervisor = 0;
  let sitesWithoutAttendanceToday = 0;
  let missingDprToday = 0;
  
  for (const s of sites) {
    if (!s.supervisor_id) projectsWithoutSupervisor++;
    
    // Check attendance for today
    const hasAttendance = todayAttendances.some(a => a.site_id === s.id);
    if (!hasAttendance && s.status === "IN_PROGRESS") sitesWithoutAttendanceToday++;
    
    // Check DPR for today - Filter in-memory
    const dprCount = allDprsForCompany.filter(d => {
      const dDate = new Date(d.created_at);
      return d.site_id === s.id &&
             dDate.getFullYear() === today.getFullYear() &&
             dDate.getMonth() === today.getMonth() &&
             dDate.getDate() === today.getDate();
    }).length;
    if (dprCount === 0 && s.status === "IN_PROGRESS") missingDprToday++;
  }

  // Add Decision Cards for urgent workflow blocks
  if (pendingApprovalsCount > 0) {
    decisionCards.push({
      id: "dec-workflow-approvals",
      title: `${pendingApprovalsCount} invitations await approval`,
      reason: "Members have accepted their invitations and are waiting for your final approval to join the workspace.",
      suggestedAction: "Review and approve pending members.",
      ctaText: "Review Approvals",
      ctaLink: "/users/invitations",
      severity: "warning"
    });
  }
  
  if (pendingResignationsCount > 0) {
    decisionCards.push({
      id: "dec-workflow-resignations",
      title: `${pendingResignationsCount} resignation requests`,
      reason: "Employees have submitted resignation requests that require your review to cleanly revoke access.",
      suggestedAction: "Review and approve/reject resignations.",
      ctaText: "Review Resignations",
      ctaLink: "/users/resignations",
      severity: "error"
    });
  }

    return ok({
      overview: {
        totalProjects,
        activeSites,
        completedProjects,
        delayedProjects,
        todayLabourCost,
        monthlyLabourCost,
        currentCashBalance,
        budgetUtilization,
        expectedProfit: financialIntelligence.profitForecast,
        outstandingPayments: Math.round(financialIntelligence.debitSum * 0.1),
        equipmentDowntime: underMaintenanceEquipment
      },
      alerts,
      decisionCards,
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
        total: pendingLeaves + pendingExpenses + pendingMRsCount + pendingPOsCount,
        expenses: pendingExpenses,
        leaves: pendingLeaves,
        materialRequests: pendingMRsCount,
        purchaseOrders: pendingPOsCount
      },
      workflowAlerts: {
        projectsWithoutPM,
        projectsWithoutSupervisor,
        pendingInvitations: pendingInvitationsCount,
        pendingApprovals: pendingApprovalsCount,
        pendingResignations: pendingResignationsCount,
        projectsWithoutBudget: projectsWithoutBudgetCount,
        sitesWithoutAttendanceToday,
        missingDprToday,
        unassignedProjects,
        inactiveMembers: inactiveMembersCount
      }
    });
  } catch (error: any) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});
