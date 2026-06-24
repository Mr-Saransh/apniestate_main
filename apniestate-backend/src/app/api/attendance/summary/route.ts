import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/response";

export const GET = withAuth(async (_req, user) => {
  let site = null;
  if (user.role === "SITE_SUPERVISOR") {
    site = await prisma.site.findFirst({
      where: { supervisor_id: user.sub }
    });
  }
  if (!site) {
    site = await prisma.site.findFirst();
  }

  if (!site) {
    return ok({
      present: 0,
      absent: 0,
      halfDay: 0,
      leave: 0,
      totalWorkers: 0,
      presentPercentage: 0,
      todayLabourCost: 0
    });
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const attendances = await prisma.workerAttendance.findMany({
    where: {
      site_id: site.id,
      date: today
    },
    include: {
      worker: true
    }
  });

  let present = 0;
  let absent = 0;
  let halfDay = 0;
  let leave = 0;
  let todayLabourCost = 0;

  for (const att of attendances) {
    const rate = att.worker.daily_rate || 0;
    if (att.status === "PRESENT") {
      present++;
      todayLabourCost += rate;
    } else if (att.status === "ABSENT") {
      absent++;
    } else if (att.status === "HALF_DAY") {
      halfDay++;
      todayLabourCost += rate / 2;
    } else if (att.status === "ON_LEAVE") {
      leave++;
    }
  }

  const totalWorkers = await prisma.worker.count({
    where: { site_id: site.id, status: "ACTIVE" }
  });

  const presentPercentage = totalWorkers > 0 
    ? Math.round(((present + halfDay) / totalWorkers) * 100) 
    : 0;

  return ok({
    present,
    absent,
    halfDay,
    leave,
    totalWorkers,
    presentPercentage,
    todayLabourCost
  });
});
