// @ts-nocheck
import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/response";

/**
 * GET /api/calendar
 * Returns unified calendar events from milestones, purchase orders, tasks, and leaves
 */
export const GET = withAuth(async (req: NextRequest, user) => {
  const dbUser = await prisma.user.findUnique({ where: { id: user.sub } });
  const company_id = dbUser?.company_id;

  if (!company_id) {
    return ok({ events: [] });
  }

  const events: any[] = [];

  // Milestones
  const milestones = await prisma.milestone.findMany({
    where: { project: { company_id } },
    include: { project: true },
    take: 100,
  });

  for (const m of milestones) {
    events.push({
      id: `milestone-${m.id}`,
      title: `Milestone: ${m.name} (${m.project.name})`,
      start: m.target_date,
      type: 'MILESTONE',
      status: m.status,
      projectId: m.project_id,
      link: `/projects/${m.project_id}`,
    });
  }

  // Purchase Order delivery dates
  const pos = await prisma.purchaseOrder.findMany({
    where: { company_id },
    include: { project: true, vendor: true },
    take: 50,
  });

  for (const po of pos) {
    if (po.delivery_date) {
      events.push({
        id: `po-${po.id}`,
        title: `Delivery: PO #${po.po_number} from ${po.vendor.name}`,
        start: po.delivery_date,
        type: 'DELIVERY',
        status: po.status,
        link: `/invoices`,
      });
    }
  }

  // Tasks with due dates (high priority)
  const tasks = await prisma.task.findMany({
    where: { company_id, priority: 'HIGH', due_date: { not: null } },
    take: 30,
  });

  for (const t of tasks) {
    if (t.due_date) {
      events.push({
        id: `task-${t.id}`,
        title: `Task: ${t.title}`,
        start: t.due_date,
        type: 'TASK',
        status: t.status,
        link: `/tasks`,
      });
    }
  }

  // Sort by date
  events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  return ok(events);
});
