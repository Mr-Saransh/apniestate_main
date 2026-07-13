import { prisma } from "@/lib/prisma";
import { CreateDprInput, UpdateDprInput } from "./dpr.schema";

export async function getDprs(filters?: { project_id?: string; site_id?: string; date?: string; company_id?: string }) {
  const where: any = { deleted_at: null };
  if (filters?.site_id) where.site_id = filters.site_id;
  if (filters?.project_id) where.project_id = filters.project_id;
  if (filters?.company_id) where.company_id = filters.company_id;
  
  if (filters?.date) {
    const d = new Date(filters.date);
    d.setUTCHours(0, 0, 0, 0);
    where.report_date = d;
  }

  const dprs = await prisma.dailyReport.findMany({
    where,
    include: {
      site: { select: { id: true, name: true, project: { select: { id: true, name: true } } } },
      submitter: { select: { id: true, name: true } }
    },
    orderBy: { report_date: "desc" }
  });

  return dprs;
}

export async function getDprById(id: string, companyId?: string) {
  const where: any = { id, deleted_at: null };
  if (companyId) where.company_id = companyId;

  return prisma.dailyReport.findUnique({
    where,
    include: {
      site: { select: { id: true, name: true, project: { select: { id: true, name: true } } } },
      submitter: { select: { id: true, name: true } }
    }
  });
}

export async function generateDailySummaries(siteId: string, date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setUTCHours(23, 59, 59, 999);

  // Labour
  const attendances = await prisma.workerAttendance.findMany({
    where: { site_id: siteId, date: startOfDay },
    include: { worker: { select: { id: true, name: true, trade: true } } }
  });

  const workersPresent = attendances.filter(a => a.status === 'PRESENT').length;
  const workersAbsent = attendances.filter(a => a.status === 'ABSENT').length;
  const halfDays = attendances.filter(a => a.is_half_day).length;
  const totalOvertime = attendances.reduce((acc, a) => acc + (a.overtime_hours || 0), 0);
  const labourCost = attendances.reduce((acc, a) => acc + (a.daily_wage_snapshot || 0), 0);

  const attendance_data = {
    workersPresent, workersAbsent, halfDays, totalOvertime, labourCost,
    details: attendances.map(a => ({
      name: a.worker.name,
      trade: a.worker.trade,
      status: a.status,
      is_half_day: a.is_half_day,
      overtime: a.overtime_hours
    }))
  };

  // Materials
  const materialTxns = await prisma.inventoryTransaction.findMany({
    where: { 
      item: { site_id: siteId },
      created_at: { gte: startOfDay, lte: endOfDay }
    },
    include: { item: { include: { material: { select: { name: true, unit: true } } } } }
  });

  const materials_consumed = {
    consumed: materialTxns.filter(t => t.type === 'OUT').map(t => ({ name: t.item.material.name, quantity: t.quantity, unit: t.item.material.unit })),
    received: materialTxns.filter(t => t.type === 'IN').map(t => ({ name: t.item.material.name, quantity: t.quantity, unit: t.item.material.unit }))
  };

  // Tasks
  const tasks = await prisma.task.findMany({
    where: { site_id: siteId }
  });
  
  const issues_faced = {
    completed_tasks: tasks.filter(t => t.status === 'DONE' && t.updated_at >= startOfDay && t.updated_at <= endOfDay).map(t => t.title),
    pending_tasks: tasks.filter(t => t.status === 'TODO' || t.status === 'IN_PROGRESS').map(t => t.title),
    delayed_tasks: tasks.filter(t => t.due_date && t.due_date < new Date() && t.status !== 'DONE').map(t => t.title)
  };

  return { attendance_data, materials_consumed, issues_faced };
}

export async function createDpr(data: CreateDprInput, userId: string, companyId?: string) {
  const reportDate = data.date ? new Date(data.date) : new Date();
  reportDate.setUTCHours(0, 0, 0, 0);

  // Check duplicate
  const existing = await prisma.dailyReport.findFirst({
    where: { site_id: data.site_id, report_date: reportDate, deleted_at: null }
  });
  
  if (existing) {
    throw new Error("A Daily Progress Report for this site on this date already exists.");
  }

  // Fetch summaries dynamically
  const summaries = await generateDailySummaries(data.site_id, reportDate);

  // Get project_id from site
  const site = await prisma.site.findUnique({ where: { id: data.site_id }, select: { project_id: true } });

  const dpr = await prisma.dailyReport.create({
    data: {
      company_id: companyId,
      project_id: data.project_id || site?.project_id,
      milestone_id: data.milestone_id,
      site_id: data.site_id,
      submitted_by: userId,
      report_date: reportDate,
      summary: data.summary,
      weather: data.weather,
      temperature: data.temperature,
      start_time: data.start_time ? new Date(data.start_time) : null,
      end_time: data.end_time ? new Date(data.end_time) : null,
      work_completed: data.work_completed,
      work_in_progress: data.work_in_progress,
      tomorrow_plan: data.tomorrow_plan,
      completion_percentage: data.completion_percentage,
      reasons_for_delay: data.reasons_for_delay,
      safety_observations: data.safety_observations,
      quality_observations: data.quality_observations,
      visitor_notes: data.visitor_notes,
      remarks: data.remarks,
      status: data.status || "DRAFT",
      
      attendance_data: summaries.attendance_data as any,
      materials_consumed: summaries.materials_consumed as any,
      issues_faced: summaries.issues_faced as any,
      photos: data.photos,
    }
  });

  if (data.milestone_id && data.completion_percentage && data.completion_percentage > 0) {
    const milestone = await prisma.milestone.findUnique({ where: { id: data.milestone_id } });
    if (milestone) {
      const newProgress = Math.min((milestone.progress_percentage || 0) + data.completion_percentage, 100);
      const isCompleted = newProgress === 100;
      await prisma.milestone.update({
        where: { id: milestone.id },
        data: {
          progress_percentage: newProgress,
          ...(isCompleted ? { status: 'COMPLETED', actual_date: reportDate } : { status: 'IN_PROGRESS' })
        }
      });
    }
  }

  return dpr;
}

export async function updateDpr(id: string, data: UpdateDprInput, companyId?: string) {
  const existing = await getDprById(id, companyId);
  if (!existing) throw new Error("DPR not found");

  const updateData: any = { ...data };
  if (data.start_time) updateData.start_time = new Date(data.start_time);
  if (data.end_time) updateData.end_time = new Date(data.end_time);

  return prisma.dailyReport.update({
    where: { id },
    data: updateData
  });
}

export async function deleteDpr(id: string, companyId?: string) {
  const existing = await getDprById(id, companyId);
  if (!existing) throw new Error("DPR not found");

  return prisma.dailyReport.update({
    where: { id },
    data: { deleted_at: new Date() }
  });
}

// ─── Weekly Reports ─────────────────────────────────────────────

export async function generateWeeklyReport(data: { project_id: string; site_id?: string; start_date: string; end_date: string }, userId: string, companyId?: string) {
  const startDate = new Date(data.start_date);
  startDate.setUTCHours(0, 0, 0, 0);
  const endDate = new Date(data.end_date);
  endDate.setUTCHours(23, 59, 59, 999);

  // Fetch all DPRs for this week
  const where: any = { 
    project_id: data.project_id, 
    report_date: { gte: startDate, lte: endDate },
    deleted_at: null 
  };
  if (data.site_id) where.site_id = data.site_id;
  if (companyId) where.company_id = companyId;

  const dprs = await prisma.dailyReport.findMany({ where });

  // Aggregate Data
  let totalWorkers = 0;
  let totalLabourCost = 0;
  
  dprs.forEach(dpr => {
    if (dpr.attendance_data && typeof dpr.attendance_data === 'object') {
      const att = dpr.attendance_data as any;
      totalWorkers += (att.workersPresent || 0);
      totalLabourCost += (att.labourCost || 0);
    }
  });

  const attendance_summary = {
    total_workers_present: totalWorkers,
    total_labour_cost: totalLabourCost,
    days_reported: dprs.length
  };

  const completed_work = dprs.map(d => d.work_completed).filter(Boolean).join("\n\n");
  const delay_summary = dprs.map(d => d.reasons_for_delay).filter(Boolean).join("\n\n");
  const pending_work = dprs.length > 0 ? dprs[dprs.length - 1].tomorrow_plan : "";

  return prisma.weeklyReport.create({
    data: {
      company_id: companyId,
      project_id: data.project_id,
      site_id: data.site_id,
      generated_by: userId,
      week_start_date: startDate,
      week_end_date: endDate,
      completed_work,
      pending_work,
      delay_summary,
      attendance_summary,
      status: "GENERATED",
      site_health: delay_summary.length > 10 ? "AT_RISK" : "ON_TRACK"
    }
  });
}

export async function getWeeklyReports(filters?: { project_id?: string; site_id?: string; company_id?: string }) {
  const where: any = { deleted_at: null };
  if (filters?.site_id) where.site_id = filters.site_id;
  if (filters?.project_id) where.project_id = filters.project_id;
  if (filters?.company_id) where.company_id = filters.company_id;

  return prisma.weeklyReport.findMany({
    where,
    include: {
      project: { select: { id: true, name: true } },
      site: { select: { id: true, name: true } },
      generator: { select: { id: true, name: true } }
    },
    orderBy: { week_start_date: "desc" }
  });
}
