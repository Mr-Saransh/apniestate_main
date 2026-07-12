import { prisma } from "@/lib/prisma";

export async function getAttendances(userId: string, projectId: string, dateStr?: string, siteId?: string) {
  const date = dateStr ? new Date(dateStr) : new Date();
  date.setUTCHours(0, 0, 0, 0);

  const whereWorker: any = { is_active: true };

  // Always scope to the project
  if (siteId) {
    whereWorker.site_id = siteId;
  } else {
    whereWorker.site = { project_id: projectId };
  }

  const workers = await prisma.worker.findMany({
    where: whereWorker,
    include: {
      site: { select: { id: true, name: true, project_id: true } },
      contractor: { select: { id: true, name: true } }
    }
  });

  // Get site IDs within this project for attendance query
  const projectSiteIds = [...new Set(workers.map(w => w.site_id).filter(Boolean))] as string[];

  const attendances = await prisma.workerAttendance.findMany({
    where: {
      date: date,
      ...(siteId ? { site_id: siteId } : { site_id: { in: projectSiteIds } })
    }
  });

  return workers.map(w => {
    const att = attendances.find(a => a.worker_id === w.id);
    return {
      id: w.id,
      name: w.name,
      trade: w.trade,
      status: att ? att.status : "UNMARKED",
      check_in: att?.check_in || null,
      check_out: att?.check_out || null,
      overtime_hours: att?.overtime_hours || 0,
      is_half_day: att?.is_half_day || false,
      is_late: att?.is_late || false,
      notes: att?.notes || null,
      site_id: w.site_id,
      site_name: w.site?.name || null,
      contractor_name: w.contractor?.name || null,
      daily_rate: w.daily_rate || 0
    };
  });
}

export async function getAttendanceById(id: string) {
  return prisma.workerAttendance.findUnique({
    where: { id },
    include: { worker: true, site: true }
  });
}

export async function createAttendance(data: any, userId: string) {
  const attendanceDate = data.date ? new Date(data.date) : new Date();
  attendanceDate.setUTCHours(0, 0, 0, 0);

  let siteId = data.site_id;
  if (!siteId) {
    const worker = await prisma.worker.findUnique({
      where: { id: data.worker_id },
      select: { site_id: true }
    });
    siteId = worker?.site_id || undefined;
  }
  if (!siteId) {
    return Response.json({ success: false, error: { message: "Worker has no assigned site. Cannot mark attendance." } }, { status: 400 });
  }

  const existing = await prisma.workerAttendance.findUnique({
    where: {
      worker_id_date: {
        worker_id: data.worker_id,
        date: attendanceDate
      }
    }
  });

  if (data.status === "UNMARKED") {
    if (existing) {
      await prisma.workerAttendance.delete({ where: { id: existing.id } });
    }
    return { worker_id: data.worker_id, status: "UNMARKED" };
  }

  const checkIn = data.check_in ? new Date(data.check_in) : (["PRESENT", "LATE", "HALF_DAY"].includes(data.status) ? new Date() : null);

  const upsertData = {
    status: data.status as any,
    site_id: siteId,
    shift: data.shift || "GENERAL",
    check_in: checkIn,
    check_out: data.check_out ? new Date(data.check_out) : null,
    overtime_hours: data.overtime_hours || 0,
    is_half_day: data.status === "HALF_DAY",
    is_late: data.status === "LATE",
    notes: data.notes || null,
    marked_by: userId
  };

  if (existing) {
    const updated = await prisma.workerAttendance.update({
      where: { id: existing.id },
      data: upsertData
    });
    
    // UPSERT EXPENSE IDEMPOTENTLY
    const worker = await prisma.worker.findUnique({ where: { id: data.worker_id } });
    const amount = (worker?.daily_rate || 0) * (upsertData.is_half_day ? 0.5 : 1);
    if (amount > 0 && siteId) {
      const site = await prisma.site.findUnique({ where: { id: siteId } });
      if (site) {
        await prisma.expense.upsert({
          where: { reference_id: `att_${updated.id}` },
          create: {
            amount,
            category: "LABOUR",
            description: `Auto-generated wages for ${worker?.name} on ${attendanceDate.toISOString().split('T')[0]}`,
            site_id: siteId,
            project_id: site.project_id,
            user_id: userId,
            date: attendanceDate,
            reference_id: `att_${updated.id}`,
            status: "APPROVED"
          },
          update: {
            amount,
            description: `Auto-generated wages for ${worker?.name} on ${attendanceDate.toISOString().split('T')[0]}`
          }
        });
      }
    }
    return updated;
  } else {
    const created = await prisma.workerAttendance.create({
      data: {
        worker_id: data.worker_id,
        date: attendanceDate,
        ...upsertData
      }
    });

    // CREATE EXPENSE
    const worker = await prisma.worker.findUnique({ where: { id: data.worker_id } });
    const amount = (worker?.daily_rate || 0) * (upsertData.is_half_day ? 0.5 : 1);
    if (amount > 0 && siteId) {
      const site = await prisma.site.findUnique({ where: { id: siteId } });
      if (site) {
        await prisma.expense.create({
          data: {
            amount,
            category: "LABOUR",
            description: `Auto-generated wages for ${worker?.name} on ${attendanceDate.toISOString().split('T')[0]}`,
            site_id: siteId,
            project_id: site.project_id,
            user_id: userId,
            date: attendanceDate,
            reference_id: `att_${created.id}`,
            status: "APPROVED"
          }
        });
      }
    }
    return created;
  }
}

export async function updateAttendance(id: string, data: any) {
  const updateData: any = { ...data };
  if (data.check_in) updateData.check_in = new Date(data.check_in);
  if (data.check_out) updateData.check_out = new Date(data.check_out);
  if (data.date) updateData.date = new Date(data.date);

  return prisma.workerAttendance.update({ where: { id }, data: updateData });
}

export async function deleteAttendance(id: string) {
  await prisma.expense.deleteMany({ where: { reference_id: `att_${id}` } });
  return prisma.workerAttendance.delete({ where: { id } });
}
