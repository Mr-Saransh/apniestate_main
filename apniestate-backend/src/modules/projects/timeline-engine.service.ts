import { prisma } from "@/lib/prisma";

export async function getProjectPlanningData(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      tasks: {
        include: { assignee: { select: { id: true, name: true } } },
        orderBy: { due_date: "asc" },
      },
      milestones: {
        orderBy: { target_date: "asc" },
      },
    },
  });

  if (!project) return null;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const oneWeekLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

  const activeTasks = project.tasks;
  const completedTasks = activeTasks.filter(t => t.status === "DONE");
  const pendingTasks = activeTasks.filter(t => t.status !== "DONE");

  // 1. Recommended Daily Work (due today, or overdue)
  const dailyWork = pendingTasks.filter(t => {
    if (!t.due_date) return false;
    const due = new Date(t.due_date);
    due.setUTCHours(0, 0, 0, 0);
    return due.getTime() <= today.getTime();
  });

  // 2. Recommended Weekly Work (due in the next 7 days)
  const weeklyWork = pendingTasks.filter(t => {
    if (!t.due_date) return false;
    const due = new Date(t.due_date);
    due.setUTCHours(0, 0, 0, 0);
    return due.getTime() > today.getTime() && due.getTime() <= oneWeekLater.getTime();
  });

  // 3. Upcoming Deadlines (Milestones in next 7 days, tasks in next 3 days)
  const upcomingMilestones = project.milestones.filter(m => {
    if (m.status === "COMPLETED" || !m.target_date) return false;
    const target = new Date(m.target_date);
    return target.getTime() >= today.getTime() && target.getTime() <= oneWeekLater.getTime();
  });

  // 4. Delay Warnings
  const delayWarnings: string[] = [];
  const overdueTasks = pendingTasks.filter(t => {
    if (!t.due_date) return false;
    const due = new Date(t.due_date);
    return due.getTime() < today.getTime();
  });

  if (overdueTasks.length > 0) {
    delayWarnings.push(`${overdueTasks.length} task(s) are currently overdue.`);
  }

  const overdueMilestones = project.milestones.filter(m => {
    if (m.status === "COMPLETED" || !m.target_date) return false;
    const target = new Date(m.target_date);
    return target.getTime() < today.getTime();
  });

  if (overdueMilestones.length > 0) {
    delayWarnings.push(`${overdueMilestones.length} milestone(s) have passed their target date and are not completed.`);
  }

  // 5. Project Completion Forecast
  let forecastMessage = "Insufficient data to forecast completion.";
  let forecastedCompletionDate: Date | null = null;
  let delayDays = 0;

  if (completedTasks.length > 0 && project.start_date) {
    const elapsedMs = today.getTime() - new Date(project.start_date).getTime();
    const elapsedDays = Math.max(1, Math.round(elapsedMs / (1000 * 60 * 60 * 24)));
    const tasksPerDay = completedTasks.length / elapsedDays; // velocity

    const remainingTasks = pendingTasks.length;
    if (tasksPerDay > 0 && remainingTasks > 0) {
      const remainingDaysForecast = Math.round(remainingTasks / tasksPerDay);
      forecastedCompletionDate = new Date(today.getTime() + remainingDaysForecast * 24 * 60 * 60 * 1000);
      
      forecastMessage = `Based on task completion velocity (${tasksPerDay.toFixed(2)} tasks/day), remaining work will take approximately ${remainingDaysForecast} days. Estimated completion: ${forecastedCompletionDate.toLocaleDateString("en-IN")}.`;

      if (project.end_date) {
        const deadline = new Date(project.end_date);
        if (forecastedCompletionDate.getTime() > deadline.getTime()) {
          delayDays = Math.round((forecastedCompletionDate.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24));
          delayWarnings.push(`Project forecast is running ${delayDays} days behind schedule.`);
        }
      }
    } else if (remainingTasks === 0) {
      forecastMessage = "All tasks completed. Project is on schedule.";
    }
  }

  return {
    projectId: project.id,
    projectName: project.name,
    startDate: project.start_date,
    endDate: project.end_date,
    totalTasks: activeTasks.length,
    completedTasks: completedTasks.length,
    pendingTasks: pendingTasks.length,
    dailyWork,
    weeklyWork,
    upcomingMilestones,
    delayWarnings,
    forecastMessage,
    forecastedCompletionDate,
    delayDays,
  };
}
