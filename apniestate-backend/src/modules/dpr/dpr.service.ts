import { prisma } from "@/lib/prisma";

export async function getDprs(filters?: { project_id?: string; site_id?: string; date?: string }) {
  const where: any = {};
  if (filters?.site_id) {
    where.site_id = filters.site_id;
  } else if (filters?.project_id) {
    where.site = { project_id: filters.project_id };
  }
  if (filters?.date) {
    const d = new Date(filters.date);
    d.setUTCHours(0, 0, 0, 0);
    where.report_date = d;
  }

  return prisma.dailyReport.findMany({
    where,
    include: {
      site: {
        include: {
          project: { select: { id: true, name: true } }
        }
      },
      submitter: { select: { id: true, name: true } }
    },
    orderBy: { report_date: "desc" }
  });
}

export async function createDpr(data: any, userId: string) {
  const reportDate = data.date ? new Date(data.date) : new Date();
  reportDate.setUTCHours(0, 0, 0, 0);

  return prisma.dailyReport.create({
    data: {
      site_id: data.site_id,
      submitted_by: userId,
      report_date: reportDate,
      summary: data.work_completed || "",
      weather: data.weather || null,
      workers_count: data.workers_present ? parseInt(data.workers_present.toString()) : null,
      work_completed: data.work_completed || "",
      materials_consumed: data.materials_consumed || null,
      issues_faced: data.issues_faced || null,
      photos: data.photos ? (typeof data.photos === "string" ? data.photos : JSON.stringify(data.photos)) : null,
      tomorrow_plan: data.tomorrow_plan || null,
    },
    include: {
      site: { select: { id: true, name: true } }
    }
  });
}
