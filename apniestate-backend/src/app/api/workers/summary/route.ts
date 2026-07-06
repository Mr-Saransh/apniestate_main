import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/response";

export const GET = withAuth(async (_req, user) => {
  const company_id = user.company_id || undefined;
  if (!company_id) {
    return ok({
      totalWorkers: 0,
      activeWorkers: 0,
      tradeBreakdown: {}
    });
  }

  let site = null;
  if (user.role === "SITE_SUPERVISOR") {
    site = await prisma.site.findFirst({
      where: { supervisor_id: user.sub, company_id }
    });
  }
  if (!site) {
    site = await prisma.site.findFirst({
      where: { company_id }
    });
  }

  if (!site) {
    return ok({
      totalWorkers: 0,
      activeWorkers: 0,
      tradeBreakdown: {}
    });
  }

  const totalWorkers = await prisma.worker.count({
    where: { site_id: site.id }
  });

  const activeWorkers = await prisma.worker.count({
    where: { site_id: site.id, status: "ACTIVE" }
  });

  const workers = await prisma.worker.findMany({
    where: { site_id: site.id, status: "ACTIVE" },
    select: { trade: true }
  });

  const tradeBreakdown: Record<string, number> = {};
  for (const w of workers) {
    tradeBreakdown[w.trade] = (tradeBreakdown[w.trade] || 0) + 1;
  }

  return ok({
    totalWorkers,
    activeWorkers,
    tradeBreakdown
  });
});
