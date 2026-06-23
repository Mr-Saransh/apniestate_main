import { prisma } from "@/lib/prisma";

export async function checkAndGenerateReminders(userId: string) {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 1. Check Tasks assigned to user
    const tasks = await prisma.task.findMany({
      where: {
        assignee_id: userId,
        status: { not: "DONE" },
        due_date: { not: null },
      },
    });

    for (const task of tasks) {
      if (!task.due_date) continue;
      
      const dueDate = new Date(task.due_date);
      const reminderDays = task.reminder_days || 1;
      const diffTime = dueDate.getTime() - now.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      // Trigger if due date is within reminder window
      if (diffDays <= reminderDays && diffDays >= -1) {
        // Check if reminder already exists
        const existing = await prisma.notification.findFirst({
          where: {
            user_id: userId,
            type: "TASK_DEADLINE",
            entity_type: "Task",
            entity_id: task.id,
          },
        });

        if (!existing) {
          await prisma.notification.create({
            data: {
              user_id: userId,
              title: "Task Deadline Reminder",
              message: `Your task "${task.title}" is due soon (on ${dueDate.toLocaleDateString()}).`,
              type: "TASK_DEADLINE",
              entity_type: "Task",
              entity_id: task.id,
            },
          });
        }
      }
    }

    // 2. Check Milestones in projects managed/built by user
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { builder_id: userId },
          { manager_id: userId },
        ],
        status: "ACTIVE",
      },
      select: { id: true, name: true },
    });

    const projectIds = projects.map(p => p.id);

    if (projectIds.length > 0) {
      const milestones = await prisma.milestone.findMany({
        where: {
          project_id: { in: projectIds },
          status: { not: "COMPLETED" },
        },
      });

      for (const ms of milestones) {
        const targetDate = new Date(ms.target_date);
        const diffTime = targetDate.getTime() - now.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);

        if (diffDays <= 3 && diffDays >= -1) {
          const project = projects.find(p => p.id === ms.project_id);
          const existing = await prisma.notification.findFirst({
            where: {
              user_id: userId,
              type: "MILESTONE_DEADLINE",
              entity_type: "Milestone",
              entity_id: ms.id,
            },
          });

          if (!existing) {
            await prisma.notification.create({
              data: {
                user_id: userId,
                title: "Milestone Deadline Alert",
                message: `Milestone "${ms.name}" for project "${project?.name}" is due on ${targetDate.toLocaleDateString()}.`,
                type: "MILESTONE_DEADLINE",
                entity_type: "Milestone",
                entity_id: ms.id,
              },
            });
          }
        }
      }

      // 3. Worker Documents Expiry (14 days warning) for managers/supervisors
      const sites = await prisma.site.findMany({
        where: {
          OR: [
            { project_id: { in: projectIds } },
            { supervisor_id: userId },
          ],
        },
        select: { id: true },
      });
      const siteIds = sites.map(s => s.id);

      if (siteIds.length > 0) {
        const docWarnings = await prisma.workerDocument.findMany({
          where: {
            expiry_date: {
              gte: today,
              lte: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days
            },
            worker: {
              site_id: { in: siteIds },
            },
          },
          include: {
            worker: { select: { name: true } },
          },
        });

        for (const doc of docWarnings) {
          if (!doc.expiry_date) continue;
          
          const existing = await prisma.notification.findFirst({
            where: {
              user_id: userId,
              type: "DOCUMENT_EXPIRY",
              entity_type: "WorkerDocument",
              entity_id: doc.id,
            },
          });

          if (!existing) {
            await prisma.notification.create({
              data: {
                user_id: userId,
                title: "Worker Document Expiring",
                message: `Worker "${doc.worker.name}"'s document "${doc.name}" is expiring on ${new Date(doc.expiry_date).toLocaleDateString()}.`,
                type: "DOCUMENT_EXPIRY",
                entity_type: "WorkerDocument",
                entity_id: doc.id,
              },
            });
          }
        }
      }
    }
  } catch (err) {
    console.error("Reminder Engine error:", err);
  }
}
