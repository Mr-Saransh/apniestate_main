import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { CreateAttendanceSchema, UpdateAttendanceSchema } from "./attendance.schema";

export async function getAttendances(userId: string) {
  // Return all users (workforce) with their attendance records for today
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const workers = await prisma.user.findMany({
    where: { is_active: true },
    select: { id: true, name: true, role: true }
  });

  const attendances = await prisma.siteAttendance.findMany({
    where: {
      date: today
    }
  });

  return workers.map(w => {
    const att = attendances.find(a => a.worker_id === w.id);
    return {
      id: w.id,
      name: w.name,
      role: w.role,
      status: att ? (att.check_in ? "PRESENT" : "ABSENT") : "UNMARKED",
      created_at: att?.check_in || null
    };
  });
}

export async function getAttendanceById(id: string) {
  return prisma.siteAttendance.findUnique({ where: { id } });
}

export async function createAttendance(data: { worker_id: string; status: string; site_id?: string }, userId: string) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // Default to the first site if none provided, or look up supervisor's site
  let siteId = data.site_id;
  if (!siteId) {
    const defaultSite = await prisma.site.findFirst();
    siteId = defaultSite?.id || "";
  }

  // Find existing attendance for worker today
  const existing = await prisma.siteAttendance.findFirst({
    where: {
      worker_id: data.worker_id,
      date: today
    }
  });

  if (data.status === "UNMARKED") {
    if (existing) {
      await prisma.siteAttendance.delete({ where: { id: existing.id } });
    }
    return { worker_id: data.worker_id, status: "UNMARKED" };
  }

  const checkIn = data.status === "PRESENT" ? new Date() : null;

  if (existing) {
    return prisma.siteAttendance.update({
      where: { id: existing.id },
      data: {
        check_in: checkIn,
      }
    });
  } else {
    return prisma.siteAttendance.create({
      data: {
        site_id: siteId,
        worker_id: data.worker_id,
        date: today,
        check_in: checkIn,
      }
    });
  }
}

export async function updateAttendance(id: string, data: any) {
  return prisma.siteAttendance.update({ where: { id }, data });
}

export async function deleteAttendance(id: string) {
  return prisma.siteAttendance.delete({ where: { id } });
}
