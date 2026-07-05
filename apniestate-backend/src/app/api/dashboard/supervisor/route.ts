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
      calendarEvents: [],
      workerDistribution: [],
      attendanceGraph: [],
      weeklyLabourTrend: [],
      materialConsumption: [],
      equipmentUsage: { available: 0, inUse: 0, underMaintenance: 0 },
      materialRequests: [],
      inventoryStatus: [],
      cashbookSummary: { credit: 0, debit: 0, balance: 0 },
      upcomingDeliveries: []
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
      calendarEvents: [],
      workerDistribution: [],
      attendanceGraph: [],
      weeklyLabourTrend: [],
      materialConsumption: [],
      equipmentUsage: { available: 0, inUse: 0, underMaintenance: 0 },
      materialRequests: [],
      inventoryStatus: [],
      cashbookSummary: { credit: 0, debit: 0, balance: 0 },
      upcomingDeliveries: []
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

  // Worker Distribution by Trade
  const workers = await prisma.worker.findMany({
    where: { site_id: site.id, is_active: true }
  });
  const tradeMap: Record<string, number> = {};
  for (const w of workers) {
    tradeMap[w.trade] = (tradeMap[w.trade] || 0) + 1;
  }
  const workerDistribution = Object.entries(tradeMap).map(([trade, count]) => ({ trade, count }));

  // 2. Today's Tasks & Progress
  const tasks = await prisma.task.findMany({
    where: { site_id: site.id, company_id },
    include: { assignee: { select: { name: true } } },
    orderBy: { created_at: "desc" }
  });

  const completedTasks = tasks.filter(t => t.status === "DONE").length;
  const tasksProgress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  // 3. Pending Material Requests & Details
  const matReqs = await prisma.materialRequest.findMany({
    where: { site_id: site.id },
    include: { material: true, requester: { select: { name: true } } },
    orderBy: { created_at: "desc" },
    take: 5
  });
  const pendingMRs = matReqs.filter(r => r.status === "PENDING").length;

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
  const equipMaintenance = equipment.filter(e => e.status === "UNDER_MAINTENANCE").length;

  // 6. Project/Site Health
  const projectHealth = await calculateSiteHealthScore(site.id);

  // 7. Dynamic Site Alerts (e.g. low stock, pending reviews)
  const alerts: any[] = [];
  const allInventoryItems = await prisma.inventoryItem.findMany({
    where: {
      site_id: site.id
    },
    include: { material: true }
  });
  const lowStockItems = allInventoryItems.filter(item => item.quantity <= item.min_quantity);
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
    where: { company_id },
    include: { user: { select: { name: true } } },
    orderBy: { created_at: "desc" },
    take: 8
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

  // 10. ENRICHMENT FOR OPERATIONAL ENGINE
  // Attendance Graph & Labour Cost (last 7 days)
  const attendanceGraph: any[] = [];
  const weeklyLabourTrend: any[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setUTCHours(0, 0, 0, 0);

    const atts = await prisma.workerAttendance.findMany({
      where: { site_id: site.id, date: date }
    });

    const present = atts.filter(a => a.status === "PRESENT").length;
    const halfDay = atts.filter(a => a.status === "HALF_DAY").length;
    const absent = atts.filter(a => a.status === "ABSENT").length;
    
    let cost = 0;
    for (const a of atts) {
      if (a.status === "PRESENT" || a.status === "HALF_DAY") {
        cost += a.daily_wage_snapshot || 500; // fallback default wage
      }
    }

    const dayLabel = date.toLocaleDateString("en-US", { weekday: "short" });
    attendanceGraph.push({
      day: dayLabel,
      present: present + (halfDay * 0.5),
      absent
    });

    weeklyLabourTrend.push({
      day: dayLabel,
      cost
    });
  }

  // Inventory Status for dashboard
  const inventoryStatus = await prisma.inventoryItem.findMany({
    where: { site_id: site.id },
    include: { material: true },
    take: 8
  });

  // Cashbook site summary
  const siteCashbook = await prisma.cashbook.findMany({
    where: { site_id: site.id }
  });
  let credit = 0, debit = 0;
  for (const c of siteCashbook) {
    if (c.type === "CREDIT") credit += c.amount;
    else debit += c.amount;
  }

  // Upcoming deliveries
  const upcomingPOs = await prisma.purchaseOrder.findMany({
    where: {
      site_id: site.id,
      status: { in: ["SENT", "PARTIAL", "APPROVED"] },
      delivery_date: { gte: new Date() }
    },
    include: { vendor: { select: { name: true } } },
    orderBy: { delivery_date: "asc" },
    take: 3
  });

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
    calendarEvents,
    workerDistribution,
    attendanceGraph,
    weeklyLabourTrend,
    equipmentUsage: {
      available: equipAvailable,
      inUse: equipInUse,
      underMaintenance: equipMaintenance
    },
    materialRequests: matReqs.map(mr => ({
      id: mr.id,
      materialName: mr.material.name,
      quantity: mr.quantity,
      unit: mr.material.unit,
      status: mr.status,
      requester: mr.requester.name,
      date: mr.created_at.toISOString()
    })),
    inventoryStatus: inventoryStatus.map(inv => ({
      name: inv.material.name,
      quantity: inv.quantity,
      unit: inv.material.unit,
      minQuantity: inv.min_quantity
    })),
    cashbookSummary: {
      credit,
      debit,
      balance: credit - debit
    },
    upcomingDeliveries: upcomingPOs.map(po => ({
      poNumber: po.po_number,
      vendor: po.vendor.name,
      deliveryDate: po.delivery_date?.toISOString(),
      amount: po.total_amount
    }))
  });
});
