import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/response";
import { calculateProjectProgress, calculateProjectRiskScore } from "@/lib/engines";

export const GET = withAuth(async (req: NextRequest, user) => {
  const dbUser = await prisma.user.findUnique({ where: { id: user.sub }, select: { company_id: true } });
  const company_id = dbUser?.company_id || undefined;

  if (!company_id) {
    return ok({
      overview: { totalProjects: 0, activeSites: 0, totalTasks: 0, completedTasks: 0, overdueTasks: 0, totalWorkers: 0 },
      projectTimelines: [],
      taskBreakdown: { todo: 0, inProgress: 0, done: 0, blocked: 0 },
      milestoneProgress: [],
      weeklyProgress: [],
      risks: [],
      teamAllocation: [],
      upcomingDeliveries: [],
      recentActivities: []
    });
  }

  // Projects managed by user or all in company for PM
  const projects = await prisma.project.findMany({
    where: { company_id, OR: [{ manager_id: user.sub }, { builder_id: user.sub }] },
    include: { sites: true }
  });

  const allProjectIds = projects.map(p => p.id);

  // Tasks
  const tasks = await prisma.task.findMany({
    where: { project_id: { in: allProjectIds }, company_id },
    include: { assignee: { select: { name: true } } }
  });

  const todo = tasks.filter(t => t.status === "TODO").length;
  const inProgress = tasks.filter(t => t.status === "IN_PROGRESS").length;
  const done = tasks.filter(t => t.status === "DONE").length;
  const blocked = tasks.filter(t => t.status === "BLOCKED").length;
  const overdueTasks = tasks.filter(t => t.status !== "DONE" && t.due_date && t.due_date < new Date()).length;

  // Sites
  const sites = await prisma.site.findMany({ where: { company_id, project_id: { in: allProjectIds } } });
  const activeSites = sites.filter(s => s.status === "IN_PROGRESS").length;

  // Workers
  const totalWorkers = await prisma.worker.count({ where: { company_id, project_id: { in: allProjectIds }, is_active: true } });

  // Project timelines with progress
  const projectTimelines: any[] = [];
  for (const p of projects) {
    const progress = await calculateProjectProgress(p.id);
    const riskScore = await calculateProjectRiskScore(p.id);
    projectTimelines.push({
      id: p.id,
      name: p.name,
      status: p.status,
      progress,
      riskScore,
      startDate: p.start_date?.toISOString(),
      endDate: p.end_date?.toISOString(),
      budget: p.budget,
      actualCost: p.actual_cost,
      sitesCount: p.sites.length
    });
  }

  // Milestones
  const milestones = await prisma.milestone.findMany({
    where: { project_id: { in: allProjectIds } },
    include: { project: { select: { name: true } } },
    orderBy: { target_date: "asc" }
  });

  const milestoneProgress = milestones.map(m => ({
    id: m.id,
    name: m.name,
    projectName: m.project.name,
    targetDate: m.target_date.toISOString(),
    actualDate: m.actual_date?.toISOString(),
    status: m.status,
    weight: m.weight
  }));

  // Weekly progress (last 7 days task completion)
  const weeklyProgress: any[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setUTCHours(0, 0, 0, 0);
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const completed = tasks.filter(t => t.completed_at && t.completed_at >= date && t.completed_at < nextDate).length;
    weeklyProgress.push({
      date: date.toISOString().slice(0, 10),
      day: date.toLocaleDateString("en-US", { weekday: "short" }),
      completed
    });
  }

  // Risks
  const risks = await prisma.projectRisk.findMany({
    where: { project_id: { in: allProjectIds }, status: "OPEN" },
    include: { project: { select: { name: true } } },
    orderBy: { created_at: "desc" },
    take: 10
  });

  // Team allocation by trade
  const workers = await prisma.worker.findMany({
    where: { company_id, project_id: { in: allProjectIds }, is_active: true },
    select: { trade: true }
  });
  const tradeMap: Record<string, number> = {};
  for (const w of workers) {
    tradeMap[w.trade] = (tradeMap[w.trade] || 0) + 1;
  }
  const teamAllocation = Object.entries(tradeMap).map(([trade, count]) => ({ trade, count })).sort((a, b) => b.count - a.count);

  // Upcoming deliveries
  const upcomingPOs = await prisma.purchaseOrder.findMany({
    where: {
      company_id,
      project_id: { in: allProjectIds },
      status: { in: ["SENT", "PARTIAL", "APPROVED"] },
      delivery_date: { gte: new Date() }
    },
    include: { vendor: { select: { name: true } }, project: { select: { name: true } } },
    orderBy: { delivery_date: "asc" },
    take: 5
  });

  const upcomingDeliveries = upcomingPOs.map(po => ({
    id: po.id,
    poNumber: po.po_number,
    vendor: po.vendor.name,
    project: po.project?.name,
    deliveryDate: po.delivery_date?.toISOString(),
    amount: po.total_amount,
    status: po.status
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
      totalProjects: projects.length,
      activeSites,
      totalTasks: tasks.length,
      completedTasks: done,
      overdueTasks,
      totalWorkers
    },
    projectTimelines,
    taskBreakdown: { todo, inProgress, done, blocked },
    milestoneProgress,
    weeklyProgress,
    risks: risks.map(r => ({
      id: r.id,
      title: r.title,
      description: r.description,
      severity: r.severity,
      probability: r.probability,
      projectName: r.project.name,
      status: r.status
    })),
    teamAllocation,
    upcomingDeliveries,
    recentActivities: recentActivities.map(a => ({
      id: a.id,
      action: a.action,
      entityType: a.entity_type,
      timestamp: a.created_at.toISOString(),
      userName: a.user?.name || "System"
    }))
  });
});
