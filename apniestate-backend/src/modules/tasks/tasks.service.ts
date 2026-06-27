import { prisma } from "@/lib/prisma";

export async function getTasks(
  userId: string,
  role: string,
  filters?: {
    project_id?: string;
    site_id?: string;
    assignee_id?: string;
    status?: string;
  },
  companyId?: string | null
) {
  if (!companyId) return [];

  const where: any = { company_id: companyId };

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

  if (role === "BUILDER" || role === "ADMIN") {
    // see all
  } else {
    where.OR = [
      { assignee_id: userId },
      { created_by: userId },
      { site: { supervisor_id: userId } },
      { project: { builder_id: userId } },
      { project: { manager_id: userId } }
    ];
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

export async function createTask(data: any, userId: string, companyId?: string | null) {
  const { due_date, ...rest } = data;
  return prisma.task.create({
    data: {
      ...rest,
      created_by: userId,
      company_id: companyId || null,
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

export async function updateTask(id: string, data: any, companyId?: string | null) {
  if (!companyId) return null;
  const existing = await prisma.task.findFirst({ where: { id, company_id: companyId } });
  if (!existing) return null;

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

export async function deleteTask(id: string, companyId?: string | null) {
  if (!companyId) return null;
  const existing = await prisma.task.findFirst({ where: { id, company_id: companyId } });
  if (!existing) return null;
  return prisma.task.delete({
    where: { id },
  });
}
