// @ts-nocheck
import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/response";

/**
 * GET /api/timeline
 * Returns all active projects with start and end dates along with their milestones
 */
export const GET = withAuth(async (req: NextRequest, user) => {
  const dbUser = await prisma.user.findUnique({ where: { id: user.sub } });
  const company_id = dbUser?.company_id;

  if (!company_id) {
    return ok([]);
  }

  const projects = await prisma.project.findMany({
    where: { company_id, status: { not: 'COMPLETED' } },
    include: {
      milestones: {
        select: { id: true, name: true, target_date: true, status: true },
        orderBy: { target_date: 'asc' },
      }
    },
    orderBy: { start_date: 'asc' },
  });

  return ok(projects);
});
