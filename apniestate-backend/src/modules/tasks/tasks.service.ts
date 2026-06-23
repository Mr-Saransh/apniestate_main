import { prisma } from "@/lib/prisma";

export async function getTasks(userId: string, role: string, filters?: {
  project_id?: string;
  site_id?: string;
  assignee_id?: string;
  status?: string;
}) {
  const where: any = {};

  if (filters?.project_id) {
    where.project_id = filters.project_id;
  }
  if (filters?.site_id) {
    where.site_id = filters.site_id;
  }
  if (filters?.assignee_id) {
    where.assignee_id = filters.assignee_id;
  }
  if (filters?.status) {
    where.status = filters.status;
  }

  // If no filters are provided, check role-based scope
  if (!filters?.project_id && !filters?.site_id && !filters?.assignee_id) {
    if (role === "BUILDER") {
      where.project = { builder_id: userId };
    } else if (role === "PROJECT_MANAGER") {
      where.project = { manager_id: userId };
    } else if (role === "SITE_SUPERVISOR") {
      where.site = { supervisor_id: userId };
    } else if (role !== "ADMIN") {
      where.OR = [
        { assignee_id: userId },
        { created_by: userId }
      ];
    }
  }

  return prisma.task.findMany({
    where,
    include: {
      assignee: { select: { id: true, name: true } },
      creator: { select: { id: true, name: true } },
      site: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } }
    },
    orderBy: { created_at: "desc" },
  });
}

export async function createTask(data: any, userId: string) {
  const { due_date, ...rest } = data;
  return prisma.task.create({
    data: {
      ...rest,
      created_by: userId,
      due_date: due_date ? new Date(due_date) : null,
      reminder_days: data.reminder_days || 1,
    },
    include: {
      assignee: { select: { id: true, name: true } },
      creator: { select: { id: true, name: true } },
      site: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } }
    }
  });
}

export async function updateTask(id: string, data: any) {
  const { due_date, ...rest } = data;
  const updateData: any = { ...rest };
  if (due_date !== undefined) {
    updateData.due_date = due_date ? new Date(due_date) : null;
  }
  if (data.status === "DONE") {
    updateData.completed_at = new Date();
  }
  return prisma.task.update({
    where: { id },
    data: updateData,
    include: {
      assignee: { select: { id: true, name: true } },
      creator: { select: { id: true, name: true } },
      site: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } }
    }
  });
}

export async function deleteTask(id: string) {
  return prisma.task.delete({
    where: { id },
  });
}
