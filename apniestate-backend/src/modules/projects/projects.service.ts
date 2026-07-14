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
      },
      {
        project_assignments: {
          some: {
            user_id: userId
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

export const createProject = async (data: CreateProjectInput, builderId: string, companyId?: string | null) => {
  const { start_date, end_date, ...rest } = data;
  
  return prisma.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: {
        ...rest,
        builder_id: builderId,
        company_id: companyId || null,
        start_date: new Date(start_date),
        end_date: end_date ? new Date(end_date) : null,
      }
    });

    // Auto-create a default site to avoid broken workflows
    await tx.site.create({
      data: {
        name: "Main Site",
        location: (data as any).address || (data as any).city || "Project Location",
        project_id: project.id,
        company_id: companyId || null,
        status: "NOT_STARTED",
      }
    });

    return project;
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

  // Find all sites under this project
  const projectSites = await prisma.site.findMany({
    where: { project_id: id },
    select: { id: true }
  });
  const siteIds = projectSites.map(s => s.id);

  // Find all labour teams under these sites
  const labourTeams = await prisma.labourTeam.findMany({
    where: { site_id: { in: siteIds } },
    select: { id: true }
  });
  const teamIds = labourTeams.map(t => t.id);

  // Execute cascade delete in a transaction to guarantee atomicity and foreign key constraint safety
  return prisma.$transaction(async (tx) => {
    // 1. Unassign workers from labour teams
    if (teamIds.length > 0) {
      await tx.worker.updateMany({
        where: { labour_team_id: { in: teamIds } },
        data: { labour_team_id: null }
      });
    }

    // 2. Delete labour teams
    if (teamIds.length > 0) {
      await tx.labourTeam.deleteMany({
        where: { id: { in: teamIds } }
      });
    }

    // 3. Unassign workers from project/site
    await tx.worker.updateMany({
      where: {
        OR: [
          { project_id: id },
          { site_id: { in: siteIds } }
        ]
      },
      data: { project_id: null, site_id: null }
    });

    // 4. Delete worker attendances
    await tx.workerAttendance.deleteMany({
      where: { site_id: { in: siteIds } }
    });

    // 5. Delete site attendances
    await tx.siteAttendance.deleteMany({
      where: { site_id: { in: siteIds } }
    });

    // 6. Delete daily reports
    await tx.dailyReport.deleteMany({
      where: { site_id: { in: siteIds } }
    });

    // 7. Delete material requests
    await tx.materialRequest.deleteMany({
      where: { site_id: { in: siteIds } }
    });

    // 8. Delete inventory items
    await tx.inventoryItem.deleteMany({
      where: { site_id: { in: siteIds } }
    });

    // 9. Unassign equipment from site
    await tx.equipment.updateMany({
      where: { site_id: { in: siteIds } },
      data: { site_id: null }
    });

    // 10. Delete worker transfers
    await tx.workerTransfer.deleteMany({
      where: {
        OR: [
          { from_site_id: { in: siteIds } },
          { to_site_id: { in: siteIds } }
        ]
      }
    });

    // 11. Delete site assignments
    await tx.siteAssignment.deleteMany({
      where: { site_id: { in: siteIds } }
    });

    // 12. Delete project assignments
    await tx.projectAssignment.deleteMany({
      where: { project_id: id }
    });

    // 13. Delete milestones
    await tx.milestone.deleteMany({
      where: { project_id: id }
    });

    // 14. Delete project delays
    await tx.projectDelay.deleteMany({
      where: { project_id: id }
    });

    // 15. Delete project risks
    await tx.projectRisk.deleteMany({
      where: { project_id: id }
    });

    // 16. Delete change orders
    await tx.changeOrder.deleteMany({
      where: { project_id: id }
    });

    // 17. Delete tasks
    await tx.task.deleteMany({
      where: {
        OR: [
          { project_id: id },
          { site_id: { in: siteIds } }
        ]
      }
    });

    // 18. Delete budgets
    await tx.budget.deleteMany({
      where: {
        OR: [
          { project_id: id },
          { site_id: { in: siteIds } }
        ]
      }
    });

    // 19. Delete expenses
    await tx.expense.deleteMany({
      where: {
        OR: [
          { project_id: id },
          { site_id: { in: siteIds } }
        ]
      }
    });

    // 20. Delete cashbook entries
    await tx.cashbook.deleteMany({
      where: {
        OR: [
          { project_id: id },
          { site_id: { in: siteIds } }
        ]
      }
    });

    // 21. Delete purchase orders
    await tx.purchaseOrder.deleteMany({
      where: {
        OR: [
          { project_id: id },
          { site_id: { in: siteIds } }
        ]
      }
    });

    // 22. Delete sites
    await tx.site.deleteMany({
      where: { project_id: id }
    });

    // Delete BOQ items and categories explicitly if Cascade isn't enough
    const boqs = await tx.bOQ.findMany({ where: { project_id: id }, select: { id: true } });
    if (boqs.length > 0) {
      const boqIds = boqs.map(b => b.id);
      const categories = await tx.bOQCategory.findMany({ where: { boq_id: { in: boqIds } }, select: { id: true } });
      if (categories.length > 0) {
        await tx.bOQItem.deleteMany({ where: { category_id: { in: categories.map(c => c.id) } } });
      }
      await tx.bOQCategory.deleteMany({ where: { boq_id: { in: boqIds } } });
      await tx.bOQ.deleteMany({ where: { project_id: id } });
    }

    // 23. Finally, delete the project
    return tx.project.delete({
      where: { id }
    });
  }, { timeout: 30000 });
};
