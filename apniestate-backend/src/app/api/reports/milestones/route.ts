import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/response";

export const GET = withAuth(async (req) => {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("project_id");
  if (!projectId) return Response.json({ message: "project_id required" }, { status: 400 });

  const milestones = await prisma.milestone.findMany({
    where: { project_id: projectId },
    orderBy: { target_date: 'asc' }
  });

  const dprs = await prisma.dailyReport.findMany({
    where: { project_id: projectId, status: "APPROVED" },
    orderBy: { report_date: 'asc' },
    select: {
      report_date: true,
      completion_percentage: true,
      summary: true
    }
  });

  const progressOverTime = dprs
    .filter(d => d.completion_percentage != null)
    .map(d => ({
      date: d.report_date.toISOString().split('T')[0],
      completion: d.completion_percentage,
      summary: d.summary
    }));

  return ok({
    milestones,
    progress: progressOverTime
  });
});
