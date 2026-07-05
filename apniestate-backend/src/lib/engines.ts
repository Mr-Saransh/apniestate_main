import { prisma } from "./prisma";

export async function calculateProjectProgress(
  projectId: string,
  preFetchedMilestones?: any[],
  preFetchedTasks?: any[]
): Promise<number> {
  const milestones = preFetchedMilestones
    ? preFetchedMilestones.filter(m => m.project_id === projectId)
    : await prisma.milestone.findMany({
        where: { project_id: projectId },
      });

  const tasks = preFetchedTasks
    ? preFetchedTasks.filter(t => t.project_id === projectId)
    : await prisma.task.findMany({
        where: { project_id: projectId },
      });

  let milestoneProgress = 0;
  if (milestones.length > 0) {
    const totalWeight = milestones.reduce((sum, m) => sum + (m.weight || 1), 0);
    const completedWeight = milestones
      .filter(m => m.status === "COMPLETED")
      .reduce((sum, m) => sum + (m.weight || 1), 0);
    milestoneProgress = completedWeight / totalWeight;
  } else {
    milestoneProgress = 1.0;
  }

  let taskProgress = 0;
  if (tasks.length > 0) {
    const completedTasks = tasks.filter(t => t.status === "DONE").length;
    taskProgress = completedTasks / tasks.length;
  } else {
    taskProgress = 1.0;
  }

  return Math.round((milestoneProgress * 0.6 + taskProgress * 0.4) * 100);
}

export async function calculateSiteHealthScore(
  siteId: string,
  preFetchedData?: {
    attendances?: any[];
    workers?: any[];
    tasks?: any[];
    dprs?: any[];
    sites?: any[];
  }
): Promise<number> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const attendanceRecords = preFetchedData?.attendances
    ? preFetchedData.attendances.filter(a => a.site_id === siteId && a.date >= sevenDaysAgo)
    : await prisma.workerAttendance.findMany({
        where: { site_id: siteId, date: { gte: sevenDaysAgo } }
      });
  
  const activeWorkersCount = preFetchedData?.workers
    ? preFetchedData.workers.filter(w => w.site_id === siteId && w.is_active).length
    : await prisma.worker.count({ where: { site_id: siteId, is_active: true } });
  const totalPossibleDays = activeWorkersCount * 7;
  const presentCount = attendanceRecords.filter(a => a.status === "PRESENT").length;
  const attendanceRate = totalPossibleDays > 0 ? (presentCount / totalPossibleDays) : 1.0;

  const siteTasks = preFetchedData?.tasks
    ? preFetchedData.tasks.filter(t => t.site_id === siteId)
    : null;
  const totalTasks = siteTasks
    ? siteTasks.length
    : await prisma.task.count({ where: { site_id: siteId } });
  const overdueTasks = siteTasks
    ? siteTasks.filter(t => t.status !== "DONE" && t.due_date && new Date(t.due_date) < new Date()).length
    : await prisma.task.count({
        where: {
          site_id: siteId,
          status: { not: "DONE" },
          due_date: { lt: new Date() }
        }
      });
  const taskFactor = totalTasks > 0 ? (1.0 - (overdueTasks / totalTasks)) : 1.0;

  const dprCount = preFetchedData?.dprs
    ? preFetchedData.dprs.filter(d => d.site_id === siteId && d.created_at >= sevenDaysAgo).length
    : await prisma.dailyReport.count({
        where: {
          site_id: siteId,
          created_at: { gte: sevenDaysAgo }
        }
      });
  const dprFactor = Math.min(dprCount / 5, 1.0);

  const site = preFetchedData?.sites
    ? preFetchedData.sites.find(s => s.id === siteId)
    : await prisma.site.findUnique({
        where: { id: siteId },
        include: { project: true }
      });
  
  let budgetFactor = 1.0;
  if (site?.project?.budget && site.project.actual_cost) {
    if (site.project.actual_cost > site.project.budget) {
      budgetFactor = Math.max(0, 1.0 - ((site.project.actual_cost - site.project.budget) / site.project.budget));
    }
  }

  const score = (attendanceRate * 0.3 + taskFactor * 0.3 + dprFactor * 0.2 + budgetFactor * 0.2) * 100;
  return Math.round(Math.max(0, Math.min(100, score)));
}

export async function calculateProjectRiskScore(
  projectId: string,
  preFetchedData?: {
    project?: any;
    tasks?: any[];
    milestones?: any[];
  }
): Promise<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL"> {
  let riskPoints = 0;

  const project = preFetchedData?.project
    ? preFetchedData.project
    : await prisma.project.findUnique({
        where: { id: projectId }
      });

  if (!project) return "LOW";

  if (project.budget && project.actual_cost) {
    if (project.actual_cost > project.budget) {
      const overrunPct = (project.actual_cost - project.budget) / project.budget;
      if (overrunPct > 0.2) riskPoints += 4;
      else if (overrunPct > 0) riskPoints += 2;
    }
  }

  const siteTasks = preFetchedData?.tasks
    ? preFetchedData.tasks.filter(t => t.project_id === projectId)
    : null;
  const overdueTasks = siteTasks
    ? siteTasks.filter(t => t.status !== "DONE" && t.due_date && new Date(t.due_date) < new Date()).length
    : await prisma.task.count({
        where: {
          project_id: projectId,
          status: { not: "DONE" },
          due_date: { lt: new Date() }
        }
      });
  if (overdueTasks > 5) riskPoints += 3;
  else if (overdueTasks > 1) riskPoints += 1;

  const projectMilestones = preFetchedData?.milestones
    ? preFetchedData.milestones.filter(m => m.project_id === projectId)
    : null;
  const overdueMilestones = projectMilestones
    ? projectMilestones.filter(m => m.status !== "COMPLETED" && m.target_date && new Date(m.target_date) < new Date()).length
    : await prisma.milestone.count({
        where: {
          project_id: projectId,
          status: { not: "COMPLETED" },
          target_date: { lt: new Date() }
        }
      });
  if (overdueMilestones > 0) riskPoints += 3;

  if (riskPoints >= 7) return "CRITICAL";
  if (riskPoints >= 4) return "HIGH";
  if (riskPoints >= 2) return "MEDIUM";
  return "LOW";
}

export async function calculateMonthlyLabourCost(companyId: string): Promise<number> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const wages = await prisma.workerWage.findMany({
    where: {
      worker: { company_id: companyId },
      period_start: { gte: startOfMonth }
    }
  });

  return wages.reduce((sum, w) => sum + w.net_amount, 0);
}
