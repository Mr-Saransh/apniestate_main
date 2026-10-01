import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { CreateMilestoneSchema, UpdateMilestoneSchema } from "./milestones.schema";
import { calculateScheduleStatus } from "@/lib/schedule";

export async function getMilestones(projectId?: string) {
  const where: any = {};
  if (projectId) where.project_id = projectId;

  const milestones = await prisma.milestone.findMany({
    where,
    include: {
      project: { select: { id: true, name: true } },
    },
    orderBy: { target_date: "asc" },
  });

  return milestones.map(m => {
    const schedule = calculateScheduleStatus({
      status: m.status,
      planned_start_date: m.planned_start_date,
      planned_end_date: m.planned_end_date || m.target_date,
      target_date: m.target_date,
      actual_start_date: m.actual_start_date,
      actual_end_date: m.actual_end_date || m.actual_date,
      actual_date: m.actual_date,
      progress_percentage: m.progress_percentage
    });

    return {
      ...m,
      planned_start_date: m.planned_start_date,
      planned_end_date: m.planned_end_date || m.target_date,
      actual_start_date: m.actual_start_date,
      actual_end_date: m.actual_end_date || m.actual_date,
      schedule_status: schedule.scheduleStatus,
      scheduleStatus: schedule.scheduleStatus,
      days_variance: schedule.daysVariance,
      daysVariance: schedule.daysVariance,
    };
  });
}

export async function getMilestoneById(id: string) {
  const m = await prisma.milestone.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, name: true } },
    },
  });

  if (!m) return null;

  const schedule = calculateScheduleStatus({
    status: m.status,
    planned_start_date: m.planned_start_date,
    planned_end_date: m.planned_end_date || m.target_date,
    target_date: m.target_date,
    actual_start_date: m.actual_start_date,
    actual_end_date: m.actual_end_date || m.actual_date,
    actual_date: m.actual_date,
    progress_percentage: m.progress_percentage
  });

  return {
    ...m,
    planned_start_date: m.planned_start_date,
    planned_end_date: m.planned_end_date || m.target_date,
    actual_start_date: m.actual_start_date,
    actual_end_date: m.actual_end_date || m.actual_date,
    schedule_status: schedule.scheduleStatus,
    scheduleStatus: schedule.scheduleStatus,
    days_variance: schedule.daysVariance,
    daysVariance: schedule.daysVariance,
  };
}

export async function createMilestone(data: z.infer<typeof CreateMilestoneSchema>) {
  const rawPlannedEnd = data.planned_end_date || data.plannedEndDate || data.target_date;
  const rawPlannedStart = data.planned_start_date || data.plannedStartDate;
  const rawActualStart = data.actual_start_date || data.actualStartDate;
  const rawActualEnd = data.actual_end_date || data.actualEndDate;

  const plannedEndDate = rawPlannedEnd ? new Date(rawPlannedEnd) : new Date();
  const plannedStartDate = rawPlannedStart ? new Date(rawPlannedStart) : null;
  
  let actualStartDate: Date | null = rawActualStart ? new Date(rawActualStart) : null;
  let actualEndDate: Date | null = rawActualEnd ? new Date(rawActualEnd) : null;

  const status = data.status || 'PENDING';
  if (status === 'IN_PROGRESS' && !actualStartDate) {
    actualStartDate = new Date();
  } else if (status === 'COMPLETED') {
    if (!actualStartDate) actualStartDate = new Date();
    if (!actualEndDate) actualEndDate = new Date();
  }

  const milestone = await prisma.milestone.create({
    data: {
      project_id: data.project_id,
      name: data.name,
      description: data.description || null,
      target_date: plannedEndDate,
      planned_start_date: plannedStartDate,
      planned_end_date: plannedEndDate,
      actual_start_date: actualStartDate,
      actual_end_date: actualEndDate,
      actual_date: actualEndDate,
      weight: data.weight || 1,
      progress_percentage: data.progress_percentage || (status === 'COMPLETED' ? 100 : 0),
      status,
    },
    include: {
      project: { select: { id: true, name: true } },
    },
  });

  if (milestone.project_id) {
    await recalculateProjectProgress(milestone.project_id);
  }

  const schedule = calculateScheduleStatus({
    status: milestone.status,
    planned_start_date: milestone.planned_start_date,
    planned_end_date: milestone.planned_end_date,
    actual_start_date: milestone.actual_start_date,
    actual_end_date: milestone.actual_end_date,
    progress_percentage: milestone.progress_percentage
  });

  return {
    ...milestone,
    schedule_status: schedule.scheduleStatus,
    scheduleStatus: schedule.scheduleStatus,
    days_variance: schedule.daysVariance,
  };
}

export async function updateMilestone(id: string, data: z.infer<typeof UpdateMilestoneSchema>) {
  const existing = await prisma.milestone.findUnique({ where: { id } });
  if (!existing) throw new Error("Milestone not found");

  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.weight !== undefined) updateData.weight = data.weight;
  if (data.progress_percentage !== undefined) updateData.progress_percentage = data.progress_percentage;

  // Planned dates update
  const rawPlannedEnd = data.planned_end_date ?? data.plannedEndDate ?? data.target_date;
  if (rawPlannedEnd !== undefined) {
    const parsed = rawPlannedEnd ? new Date(rawPlannedEnd) : null;
    if (parsed) {
      updateData.planned_end_date = parsed;
      updateData.target_date = parsed;
    }
  }

  const rawPlannedStart = data.planned_start_date ?? data.plannedStartDate;
  if (rawPlannedStart !== undefined) {
    updateData.planned_start_date = rawPlannedStart ? new Date(rawPlannedStart) : null;
  }

  // Explicit actual dates if provided
  const rawActualStart = data.actual_start_date ?? data.actualStartDate;
  if (rawActualStart !== undefined) {
    updateData.actual_start_date = rawActualStart ? new Date(rawActualStart) : null;
  }

  const rawActualEnd = data.actual_end_date ?? data.actualEndDate;
  if (rawActualEnd !== undefined) {
    const parsed = rawActualEnd ? new Date(rawActualEnd) : null;
    updateData.actual_end_date = parsed;
    updateData.actual_date = parsed;
  }

  // Status transitions
  if (data.status !== undefined) {
    updateData.status = data.status;

    // Rule: actualStartDate is recorded when work genuinely moves into IN_PROGRESS
    if (data.status === "IN_PROGRESS" && !existing.actual_start_date && !updateData.actual_start_date) {
      updateData.actual_start_date = new Date();
    }

    // Rule: actualEndDate is recorded when work becomes COMPLETED
    if (data.status === "COMPLETED") {
      if (!existing.actual_end_date && !updateData.actual_end_date) {
        const completedDate = new Date();
        updateData.actual_end_date = completedDate;
        updateData.actual_date = completedDate;
      }
      if (!existing.actual_start_date && !updateData.actual_start_date) {
        updateData.actual_start_date = existing.created_at || new Date();
      }
      if (updateData.progress_percentage === undefined && (existing.progress_percentage || 0) < 100) {
        updateData.progress_percentage = 100;
      }
    }

    // Rule: Re-opening an activity must not silently destroy historical actual dates
    // If status moves back from COMPLETED to IN_PROGRESS or PENDING, preserve actual_start_date and actual_end_date
  }

  const milestone = await prisma.milestone.update({
    where: { id },
    data: updateData,
    include: {
      project: { select: { id: true, name: true } },
    },
  });

  if (milestone.project_id) {
    await recalculateProjectProgress(milestone.project_id);
  }

  const schedule = calculateScheduleStatus({
    status: milestone.status,
    planned_start_date: milestone.planned_start_date,
    planned_end_date: milestone.planned_end_date || milestone.target_date,
    actual_start_date: milestone.actual_start_date,
    actual_end_date: milestone.actual_end_date || milestone.actual_date,
    progress_percentage: milestone.progress_percentage
  });

  return {
    ...milestone,
    schedule_status: schedule.scheduleStatus,
    scheduleStatus: schedule.scheduleStatus,
    days_variance: schedule.daysVariance,
  };
}

export async function deleteMilestone(id: string) {
  const milestone = await prisma.milestone.delete({ where: { id } });
  if (milestone.project_id) {
    await recalculateProjectProgress(milestone.project_id);
  }
  return milestone;
}

async function recalculateProjectProgress(projectId: string) {
  const milestones = await prisma.milestone.findMany({
    where: { project_id: projectId },
  });

  if (milestones.length === 0) return;

  const totalWeight = milestones.reduce((sum, m) => sum + (m.weight || 1), 0);
  const completedWeight = milestones
    .filter(m => m.status === "COMPLETED")
    .reduce((sum, m) => sum + (m.weight || 1), 0);

  const progress = Math.round((completedWeight / totalWeight) * 100);

  await prisma.project.update({
    where: { id: projectId },
    data: { progress_percentage: progress },
  });
}
