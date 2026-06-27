import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/response";
import {
  calculateProjectProgress,
  calculateSiteHealthScore
} from "@/lib/engines";

export const GET = withAuth(async (req: NextRequest, user) => {
  const dbUser = await prisma.user.findUnique({
    where: { id: user.sub },
    select: { company_id: true, role: true }
  });

  let company_id = dbUser?.company_id || undefined;
  const userRole = dbUser?.role || user.role || 'SITE_SUPERVISOR';

  // Fallback: If company_id is not directly set on user, find it from their assigned site!
  if (!company_id) {
    const assignedSite = await prisma.site.findFirst({
      where: { supervisor_id: user.sub },
      select: { company_id: true }
    });
    if (assignedSite?.company_id) {
      company_id = assignedSite.company_id;
      await prisma.user.update({
        where: { id: user.sub },
        data: { company_id }
      });
    }
  }

  if (!company_id) {
    return ok({
      site: null,
      overview: {
        workforce: { present: 0, absent: 0 },
        labourCost: 0,
        tasksProgress: 0,
        pendingMRs: 0,
        dprSubmitted: false,
        equipmentCount: { available: 0, inUse: 0 }
      },
      tasks: [],
      alerts: [],
      activities: [],
      calendarEvents: []
    });
  }

  // Use unified visibility logic to find the first accessible site
  const siteWhere: any = { company_id };
  if (userRole === "BUILDER" || userRole === "ADMIN") {
    // see all
  } else {
    siteWhere.OR = [
      { supervisor_id: user.sub },
      { project: { builder_id: user.sub } },
      { project: { manager_id: user.sub } }
    ];
  }

  // Find the user's active site context
  const site = await prisma.site.findFirst({
    where: siteWhere,
    include: { project: true }
  });

  if (!site) {
    return ok({
      site: null,
      overview: {
        workforce: { present: 0, absent: 0 },
        labourCost: 0,
        tasksProgress: 0,
        pendingMRs: 0,
        dprSubmitted: false,
        equipmentCount: { available: 0, inUse: 0 }
      },
      tasks: [],
      alerts: [],
      activities: [],
      calendarEvents: []
    });
  }

  // 1. Workforce & Labour Cost Today
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const todayAttendances = await prisma.workerAttendance.findMany({
    where: {
      site_id: site.id,
      date: today,
      status: "PRESENT"
    },
    include: { worker: true }
  });

  const activeWorkers = await prisma.worker.count({
    where: { site_id: site.id, is_active: true }
  });

  let todayLabourCost = 0;
  for (const att of todayAttendances) {
    todayLabourCost += att.daily_wage_snapshot || att.worker.daily_rate || 0;
  }

  // 2. Today's Tasks & Progress
  const tasks = await prisma.task.findMany({
    where: { site_id: site.id, company_id },
    include: { assignee: { select: { name: true } } },
    orderBy: { created_at: "desc" }
  });

  const completedTasks = tasks.filter(t => t.status === "DONE").length;
  const tasksProgress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  // 3. Pending Material Requests
  const pendingMRs = await prisma.materialRequest.count({
    where: { site_id: site.id, status: "PENDING" }
  });

  // 4. DPR Submission Status
  const todayDPR = await prisma.dailyReport.findFirst({
    where: {
      site_id: site.id,
      created_at: { gte: today }
    }
  });

  // 5. Equipment Utilization
  const equipment = await prisma.equipment.findMany({
    where: { site_id: site.id }
  });
  const equipAvailable = equipment.filter(e => e.status === "AVAILABLE").length;
  const equipInUse = equipment.filter(e => e.status === "IN_USE").length;

  // 6. Project/Site Health
  const projectHealth = await calculateSiteHealthScore(site.id);

  // 7. Dynamic Site Alerts (e.g. low stock, pending reviews)
  const alerts: any[] = [];
  const lowStockItems = await prisma.inventoryItem.findMany({
    where: {
      site_id: site.id,
      quantity: { lte: prisma.inventoryItem.fields.min_quantity }
    },
    include: { material: true }
  });
  for (const item of lowStockItems) {
    alerts.push({
      type: "LOW_STOCK",
      title: `Low Stock: ${item.material.name}`,
      description: `Stock level is ${item.quantity} ${item.material.unit}. Minimum: ${item.min_quantity}`,
      severity: "error",
      link: "/inventory"
    });
  }

  // 8. Recent Activities
  const recentActivities = await prisma.activityLog.findMany({
    where: {
      company_id
    },
    include: { user: { select: { name: true } } },
    orderBy: { created_at: "desc" },
    take: 5
  });

  // 9. Calendar milestones
  const milestones = await prisma.milestone.findMany({
    where: { project_id: site.project_id },
    orderBy: { target_date: "asc" }
  });
  const calendarEvents = milestones.map(m => ({
    id: m.id,
    title: `Milestone: ${m.name}`,
    start: m.target_date.toISOString(),
    type: "MILESTONE"
  }));

  return ok({
    site: {
      id: site.id,
      name: site.name,
      location: site.location,
      status: site.status,
      project: {
        id: site.project.id,
        name: site.project.name,
        progress: await calculateProjectProgress(site.project_id),
        health: projectHealth
      }
    },
    overview: {
      workforce: {
        present: todayAttendances.length,
        absent: Math.max(0, activeWorkers - todayAttendances.length)
      },
      labourCost: todayLabourCost,
      tasksProgress,
      pendingMRs,
      dprSubmitted: !!todayDPR,
      equipmentCount: {
        available: equipAvailable,
        inUse: equipInUse
      }
    },
    tasks: tasks.map(t => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      assignee: t.assignee?.name || "Unassigned",
      dueDate: t.due_date ? t.due_date.toISOString() : null
    })),
    alerts,
    activities: recentActivities.map(act => ({
      id: act.id,
      action: act.action,
      details: `${act.entity_type} was ${act.action.toLowerCase()}`,
      timestamp: act.created_at.toISOString(),
      userName: act.user?.name || "System"
    })),
    calendarEvents
  });
});
