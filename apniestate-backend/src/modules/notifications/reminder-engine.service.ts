import { prisma } from "@/lib/prisma";

export async function checkAndGenerateReminders(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, company_id: true },
    });
    if (!user) return;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const isCrmUser =
      user.role === "TELECALLER" ||
      user.role === "SALES_EXECUTIVE" ||
      user.role === "CRM_MANAGER" ||
      user.role === "BUILDER" ||
      user.role === "ADMIN";

    // ─────────────────────────────────────────────────────────────
    // 1. CRM REMINDERS (Follow-ups, Assigned Leads, Activities)
    // ─────────────────────────────────────────────────────────────
    if (isCrmUser) {
      // 1.1 Pending follow-ups due today or overdue
      try {
        const followups = await prisma.crmFollowup.findMany({
          where: {
            status: "PENDING",
            OR: [
              { lead: { assigned_to: userId } },
              { created_by: userId },
            ],
            due_at: {
              lte: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Due in next 24 hours or past
            },
          },
          include: {
            lead: { select: { id: true, name: true, phone: true } },
          },
          take: 15,
        });

        for (const fu of followups) {
          const existing = await prisma.notification.findFirst({
            where: {
              user_id: userId,
              entity_type: "CrmFollowup",
              entity_id: fu.id,
            },
          });

          if (!existing) {
            const isOverdue = new Date(fu.due_at) < now;
            await prisma.notification.create({
              data: {
                user_id: userId,
                company_id: fu.company_id,
                title: isOverdue ? `Overdue Follow-up: ${fu.lead.name}` : `Follow-up Due: ${fu.lead.name}`,
                message: fu.note ? `Follow-up: "${fu.note}"` : `Follow-up call/meeting is due with ${fu.lead.name}.`,
                type: isOverdue ? "warning" : "info",
                link: "/crm?tab=followups",
                entity_type: "CrmFollowup",
                entity_id: fu.id,
                priority: isOverdue ? "HIGH" : "NORMAL",
              },
            });
          }
        }
      } catch (e) {
        console.warn("CRM followup reminders error:", e);
      }

      // 1.2 Newly assigned leads (created in last 7 days)
      try {
        const assignedLeads = await prisma.crmLead.findMany({
          where: {
            assigned_to: userId,
            status: "NEW",
            created_at: {
              gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
            },
          },
          take: 10,
        });

        for (const ld of assignedLeads) {
          const existing = await prisma.notification.findFirst({
            where: {
              user_id: userId,
              entity_type: "CrmLead",
              entity_id: ld.id,
            },
          });

          if (!existing) {
            await prisma.notification.create({
              data: {
                user_id: userId,
                company_id: ld.company_id,
                title: `New Lead Assigned: ${ld.name}`,
                message: `Lead ${ld.name} (${ld.phone || "No phone"}) is assigned to you for sales follow-up.`,
                type: "info",
                link: "/crm?tab=leads",
                entity_type: "CrmLead",
                entity_id: ld.id,
                priority: "NORMAL",
              },
            });
          }
        }
      } catch (e) {
        console.warn("CRM assigned leads reminders error:", e);
      }

      // 1.3 Upcoming CRM Activities / Site Visits
      try {
        const activities = await prisma.crmActivity.findMany({
          where: {
            completed: false,
            OR: [
              { lead: { assigned_to: userId } },
              { created_by: userId },
            ],
            due_at: {
              not: null,
              lte: new Date(now.getTime() + 48 * 60 * 60 * 1000),
            },
          },
          include: {
            lead: { select: { id: true, name: true } },
          },
          take: 10,
        });

        for (const act of activities) {
          const existing = await prisma.notification.findFirst({
            where: {
              user_id: userId,
              entity_type: "CrmActivity",
              entity_id: act.id,
            },
          });

          if (!existing) {
            await prisma.notification.create({
              data: {
                user_id: userId,
                company_id: act.company_id,
                title: `Upcoming Activity: ${act.title}`,
                message: act.description || `Scheduled activity for ${act.lead?.name || "client"}.`,
                type: "info",
                link: "/crm?tab=activities",
                entity_type: "CrmActivity",
                entity_id: act.id,
                priority: "NORMAL",
              },
            });
          }
        }
      } catch (e) {
        console.warn("CRM activities reminders error:", e);
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 2. ERP REMINDERS (Tasks, Material Requests, Expenses, Milestones)
    // ─────────────────────────────────────────────────────────────
    // 2.1 Tasks assigned to user
    try {
      const tasks = await prisma.task.findMany({
        where: {
          assignee_id: userId,
          status: { not: "DONE" },
          due_date: { not: null },
        },
        take: 15,
      });

      for (const task of tasks) {
        if (!task.due_date) continue;
        const dueDate = new Date(task.due_date);
        const reminderDays = task.reminder_days || 2;
        const diffTime = dueDate.getTime() - now.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);

        if (diffDays <= reminderDays && diffDays >= -7) {
          const existing = await prisma.notification.findFirst({
            where: {
              user_id: userId,
              type: "TASK_DEADLINE",
              entity_type: "Task",
              entity_id: task.id,
            },
          });

          if (!existing) {
            const isOverdue = diffDays < 0;
            await prisma.notification.create({
              data: {
                user_id: userId,
                title: isOverdue ? `Overdue Task: ${task.title}` : `Task Deadline: ${task.title}`,
                message: `Your task "${task.title}" is ${isOverdue ? "overdue" : `due on ${dueDate.toLocaleDateString()}`}.`,
                type: isOverdue ? "danger" : "warning",
                link: "/operations?tab=tasks",
                entity_type: "Task",
                entity_id: task.id,
                priority: isOverdue ? "HIGH" : "NORMAL",
              },
            });
          }
        }
      }
    } catch (e) {
      console.warn("ERP task reminders error:", e);
    }

    // 2.2 Material Requests Pending Approval (for Builder / PM)
    if (user.role === "BUILDER" || user.role === "ADMIN" || user.role === "PROJECT_MANAGER") {
      try {
        const pendingRequests = await prisma.materialRequest.findMany({
          where: {
            status: { in: ["SUBMITTED", "PENDING_APPROVAL"] },
            site: {
              project: {
                OR: [
                  { builder_id: userId },
                  { manager_id: userId },
                ],
              },
            },
          },
          include: {
            material: { select: { name: true } },
            site: { select: { name: true } },
          },
          take: 10,
        });

        for (const req of pendingRequests) {
          const existing = await prisma.notification.findFirst({
            where: {
              user_id: userId,
              entity_type: "MaterialRequest",
              entity_id: req.id,
            },
          });

          if (!existing) {
            await prisma.notification.create({
              data: {
                user_id: userId,
                title: "Material Request Pending Approval",
                message: `Request for ${req.quantity} units of ${req.material?.name || "material"} at ${req.site?.name || "site"} requires your review.`,
                type: "warning",
                link: "/purchase?tab=requests",
                entity_type: "MaterialRequest",
                entity_id: req.id,
                priority: "HIGH",
              },
            });
          }
        }
      } catch (e) {
        console.warn("Material request reminders error:", e);
      }
    }

    // 2.3 Expense Approvals (for Builder / Accountant)
    if (user.role === "BUILDER" || user.role === "ADMIN" || user.role === "ACCOUNTANT") {
      try {
        if (user.company_id) {
          const pendingExpenses = await prisma.expense.findMany({
            where: {
              status: "PENDING",
              site: {
                project: {
                  company_id: user.company_id,
                },
              },
            },
            take: 10,
          });

          for (const exp of pendingExpenses) {
            const existing = await prisma.notification.findFirst({
              where: {
                user_id: userId,
                entity_type: "Expense",
                entity_id: exp.id,
              },
            });

            if (!existing) {
              await prisma.notification.create({
                data: {
                  user_id: userId,
                  company_id: user.company_id,
                  title: "Expense Voucher Pending Approval",
                  message: `Expense of ₹${exp.amount.toLocaleString("en-IN")} (${exp.category}) requires approval.`,
                  type: "warning",
                  link: "/finance?tab=expenses",
                  entity_type: "Expense",
                  entity_id: exp.id,
                  priority: "HIGH",
                },
              });
            }
          }
        }
      } catch (e) {
        console.warn("Expense approval reminders error:", e);
      }
    }

    // 2.4 Milestones in projects managed/built by user
    try {
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
          take: 15,
        });

        for (const ms of milestones) {
          const targetDate = new Date(ms.target_date);
          const diffTime = targetDate.getTime() - now.getTime();
          const diffDays = diffTime / (1000 * 60 * 60 * 24);

          if (diffDays <= 3 && diffDays >= -7) {
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
                  title: diffDays < 0 ? `Overdue Milestone: ${ms.name}` : `Milestone Alert: ${ms.name}`,
                  message: `Milestone "${ms.name}" for project "${project?.name}" is ${diffDays < 0 ? "delayed" : `due on ${targetDate.toLocaleDateString()}`}.`,
                  type: diffDays < 0 ? "danger" : "warning",
                  link: "/progress?tab=milestones",
                  entity_type: "Milestone",
                  entity_id: ms.id,
                },
              });
            }
          }
        }

        // 2.5 Worker Documents Expiry (14 days warning) for managers/supervisors
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
            take: 10,
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
                  type: "warning",
                  link: "/operations?tab=workers",
                  entity_type: "WorkerDocument",
                  entity_id: doc.id,
                },
              });
            }
          }
        }
      }
    } catch (e) {
      console.warn("Milestone/Worker doc reminders error:", e);
    }

    // ─────────────────────────────────────────────────────────────
    // 3. WELCOME NOTIFICATION IF EMPTY
    // ─────────────────────────────────────────────────────────────
    const totalCount = await prisma.notification.count({
      where: { user_id: userId },
    });

    if (totalCount === 0) {
      const isTelecaller =
        user.role === "TELECALLER" ||
        user.role === "SALES_EXECUTIVE" ||
        user.role === "CRM_MANAGER";

      await prisma.notification.create({
        data: {
          user_id: userId,
          company_id: user.company_id,
          title: isTelecaller ? "Welcome to Telecaller CRM" : "Welcome to Apni Estate",
          message: isTelecaller
            ? "Your sales portal is active. Any assigned leads, scheduled follow-ups, and customer visits will alert here."
            : "Your construction management workspace is ready. Approvals, deadlines, and project updates will appear here.",
          type: "info",
          link: isTelecaller ? "/crm?tab=leads" : "/dashboard",
          priority: "NORMAL",
        },
      });
    }
  } catch (err) {
    console.error("Reminder Engine fatal error:", err);
  }
}
