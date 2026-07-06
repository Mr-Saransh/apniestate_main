import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/response";

export const GET = withAuth(async (_req, user) => {
  const company_id = user.company_id || undefined;
  if (!company_id) {
    return ok({ project: null });
  }

  // If supervisor, find their supervised site. Otherwise find first site.
  let site = null;
  if (user.role === "SITE_SUPERVISOR") {
    site = await prisma.site.findFirst({
      where: { supervisor_id: user.sub, company_id },
      include: { project: true }
    });
  }
  
  if (!site) {
    site = await prisma.site.findFirst({
      where: { company_id },
      include: { project: true }
    });
  }

  if (!site) {
    return ok({ project: null });
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // Count workers present today
  const workersPresentToday = await prisma.workerAttendance.count({
    where: {
      site_id: site.id,
      date: today,
      status: { in: ["PRESENT", "HALF_DAY"] }
    }
  });

  // Calculate today's labor cost
  const presentAttendances = await prisma.workerAttendance.findMany({
    where: {
      site_id: site.id,
      date: today,
      status: { in: ["PRESENT", "HALF_DAY"] }
    },
    include: {
      worker: true
    }
  });

  let todayLabourCost = 0;
  for (const att of presentAttendances) {
    const rate = att.worker.daily_rate || 0;
    todayLabourCost += att.status === "HALF_DAY" ? rate / 2 : rate;
  }

  // Count pending tasks
  const pendingTasks = await prisma.task.count({
    where: {
      site_id: site.id,
      status: { not: "DONE" }
    }
  });

  // Count pending material requests
  const pendingMaterialRequests = await prisma.materialRequest.count({
    where: {
      site_id: site.id,
      status: "PENDING"
    }
  });

  const formattedDate = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  return ok({
    id: site.project.id,
    name: site.project.name,
    siteName: site.name,
    siteId: site.id,
    location: site.location,
    status: site.project.status,
    progress: site.progress_percentage || 0,
    workersPresentToday,
    todayLabourCost,
    pendingTasks,
    pendingMaterialRequests,
    date: formattedDate
  });
});
