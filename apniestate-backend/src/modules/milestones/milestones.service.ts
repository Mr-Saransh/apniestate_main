import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { CreateMilestoneSchema, UpdateMilestoneSchema } from "./milestones.schema";

export async function getMilestones(projectId?: string) {
  const where: any = {};
  if (projectId) where.project_id = projectId;

  return prisma.milestone.findMany({
    where,
    include: {
      project: { select: { id: true, name: true } },
    },
    orderBy: { target_date: "asc" },
  });
}

export async function getMilestoneById(id: string) {
  return prisma.milestone.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, name: true } },
    },
  });
}

export async function createMilestone(data: z.infer<typeof CreateMilestoneSchema>) {
  return prisma.milestone.create({
    data: {
      ...data,
      target_date: new Date(data.target_date),
    },
    include: {
      project: { select: { id: true, name: true } },
    },
  });
}

export async function updateMilestone(id: string, data: z.infer<typeof UpdateMilestoneSchema>) {
  const updateData: any = { ...data };
  if (data.target_date) updateData.target_date = new Date(data.target_date);
  if (data.status === "COMPLETED") updateData.actual_date = new Date();

  const milestone = await prisma.milestone.update({
    where: { id },
    data: updateData,
    include: {
      project: { select: { id: true, name: true } },
    },
  });

  // Recalculate project progress based on milestones
  if (milestone.project_id) {
    await recalculateProjectProgress(milestone.project_id);
  }

  return milestone;
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
