import { prisma } from "@/lib/prisma";
import type { CreateProjectInput, UpdateProjectInput } from "./projects.schema";

function calculateProjectProgress(project: {
  tasks: { status: string }[];
  milestones: { status: string }[];
}) {
  const tasks = project.tasks || [];
  if (tasks.length > 0) {
    const completed = tasks.filter(t => t.status === "DONE").length;
    return Math.round((completed / tasks.length) * 100);
  }
  const milestones = project.milestones || [];
  if (milestones.length > 0) {
    const completed = milestones.filter(m => m.status === "COMPLETED").length;
    return Math.round((completed / milestones.length) * 100);
  }
  return 0;
}

export const getProjects = async (userId: string, role: string, companyId?: string | null) => {
  if (!companyId) return [];

  // Self-repair: Assign current companyId to any projects created by this builder that lack it
  if (role === "BUILDER") {
    await prisma.project.updateMany({
      where: {
        builder_id: userId,
        company_id: null
      },
      data: {
        company_id: companyId
      }
    });
  }

  const where: any = { company_id: companyId };

  if (role === "BUILDER" || role === "ADMIN") {
    // Builders and Admins see all projects under the company
  } else {
    // Non-builders see projects they created, manage, or supervisor sites inside
    where.OR = [
      { builder_id: userId },
      { manager_id: userId },
      {
        sites: {
          some: {
            supervisor_id: userId
          }
        }
      }
    ];
  }

  const projects = await prisma.project.findMany({
    where,
    include: {
      builder: { select: { id: true, name: true } },
      manager: { select: { id: true, name: true } },
      sites: {
        include: {
          supervisor: { select: { id: true, name: true } }
        }
      },
      tasks: { select: { status: true } },
      milestones: { select: { status: true } },
      _count: { select: { sites: true, tasks: true, milestones: true } }
    },
    orderBy: { created_at: "desc" },
  });

  return projects.map(p => {
    const progress_percentage = calculateProjectProgress(p);
    return {
      ...p,
      progress_percentage,
      tasks: undefined,
      milestones: undefined
    };
  });
};

export const getProjectById = async (id: string, companyId?: string | null) => {
  if (!companyId) return null;

  const project = await prisma.project.findFirst({
    where: { id, company_id: companyId },
    include: {
      builder: { select: { id: true, name: true, email: true, phone: true } },
      manager: { select: { id: true, name: true, email: true, phone: true } },
      sites: {
        include: {
          supervisor: { select: { id: true, name: true } }
        }
      },
      milestones: {
        orderBy: { target_date: 'asc' }
      },
      tasks: {
        include: {
          assignee: { select: { id: true, name: true } }
        }
      },
      budgets: true,
      _count: { select: { sites: true, tasks: true, milestones: true, workers: true } }
    }
  });

  if (!project) return null;

  const progress_percentage = calculateProjectProgress(project);

  return {
    ...project,
    progress_percentage,
  };
};

export const createProject = (data: CreateProjectInput, builderId: string, companyId?: string | null) => {
  const { start_date, end_date, ...rest } = data;
  return prisma.project.create({
    data: {
      ...rest,
      builder_id: builderId,
      company_id: companyId || null,
      start_date: new Date(start_date),
      end_date: end_date ? new Date(end_date) : null,
    }
  });
};

export const updateProject = async (id: string, data: UpdateProjectInput, companyId?: string | null) => {
  if (!companyId) return null;
  const existing = await prisma.project.findFirst({ where: { id, company_id: companyId } });
  if (!existing) return null;

  const { start_date, end_date, ...rest } = data;
  const updateData: any = { ...rest };
  if (start_date) updateData.start_date = new Date(start_date);
  if (end_date !== undefined) updateData.end_date = end_date ? new Date(end_date) : null;
  return prisma.project.update({ where: { id }, data: updateData });
};

export const deleteProject = async (id: string, companyId?: string | null) => {
  if (!companyId) return null;
  const existing = await prisma.project.findFirst({ where: { id, company_id: companyId } });
  if (!existing) return null;
  return prisma.project.delete({ where: { id } });
};
