import { prisma } from "@/lib/prisma";
import { z } from "zod";
import {
  CreateWorkerSchema,
  UpdateWorkerSchema,
  CreateWorkerDocumentSchema,
  CreateWorkerWageSchema,
  CreateWorkerTransferSchema,
  CreateWorkerEmergencyContactSchema,
} from "./workers.schema";

// ─── Worker CRUD ─────────────────────────────────────────

export async function getWorkers(filters?: {
  site_id?: string;
  project_id?: string;
  contractor_id?: string;
  status?: string;
  trade?: string;
}) {
  const where: any = {};
  if (filters?.site_id) where.site_id = filters.site_id;
  if (filters?.project_id) where.project_id = filters.project_id;
  if (filters?.contractor_id) where.contractor_id = filters.contractor_id;
  if (filters?.status) where.status = filters.status;
  if (filters?.trade) where.trade = filters.trade;

  return prisma.worker.findMany({
    where,
    include: {
      contractor: { select: { id: true, name: true, company: true } },
      site: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
      labour_team: { select: { id: true, name: true } },
      _count: { select: { attendances: true, documents: true } },
    },
    orderBy: { created_at: "desc" },
  });
}

export async function getWorkerById(id: string) {
  return prisma.worker.findUnique({
    where: { id },
    include: {
      contractor: { select: { id: true, name: true, company: true } },
      site: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
      labour_team: { select: { id: true, name: true } },
      emergency_contacts: true,
      documents: true,
      _count: { select: { attendances: true, wages: true, transfers: true, leaves: true } },
    },
  });
}

export async function createWorker(data: z.infer<typeof CreateWorkerSchema>) {
  return prisma.worker.create({
    data: {
      ...data,
      date_of_joining: data.date_of_joining ? new Date(data.date_of_joining) : null,
    },
    include: {
      contractor: { select: { id: true, name: true } },
      site: { select: { id: true, name: true } },
    },
  });
}

export async function updateWorker(id: string, data: z.infer<typeof UpdateWorkerSchema>) {
  const updateData: any = { ...data };
  if (data.date_of_joining) updateData.date_of_joining = new Date(data.date_of_joining);
  return prisma.worker.update({
    where: { id },
    data: updateData,
    include: {
      contractor: { select: { id: true, name: true } },
      site: { select: { id: true, name: true } },
    },
  });
}

export async function deleteWorker(id: string) {
  return prisma.worker.update({
    where: { id },
    data: { is_active: false, status: "TERMINATED" },
  });
}

// ─── Worker Documents ────────────────────────────────────

export async function getWorkerDocuments(workerId: string) {
  return prisma.workerDocument.findMany({
    where: { worker_id: workerId },
    orderBy: { created_at: "desc" },
  });
}

export async function createWorkerDocument(
  workerId: string,
  data: z.infer<typeof CreateWorkerDocumentSchema>
) {
  return prisma.workerDocument.create({
    data: {
      worker_id: workerId,
      ...data,
      expiry_date: data.expiry_date ? new Date(data.expiry_date) : null,
    },
  });
}

export async function deleteWorkerDocument(id: string) {
  return prisma.workerDocument.delete({ where: { id } });
}

// ─── Worker Wages ────────────────────────────────────────

export async function getWorkerWages(workerId: string) {
  return prisma.workerWage.findMany({
    where: { worker_id: workerId },
    orderBy: { period_start: "desc" },
  });
}

export async function createWorkerWage(
  workerId: string,
  data: z.infer<typeof CreateWorkerWageSchema>
) {
  const overtimeRate = data.overtime_rate || (data.daily_rate / 8) * 1.5;
  const grossAmount =
    data.present_days * data.daily_rate + data.overtime_hours * overtimeRate;
  const netAmount = grossAmount - (data.deductions || 0);

  return prisma.workerWage.create({
    data: {
      worker_id: workerId,
      period_start: new Date(data.period_start),
      period_end: new Date(data.period_end),
      present_days: data.present_days,
      overtime_hours: data.overtime_hours,
      daily_rate: data.daily_rate,
      overtime_rate: overtimeRate,
      gross_amount: grossAmount,
      net_amount: netAmount,
      deductions: data.deductions || 0,
      notes: data.notes,
    },
  });
}

export async function updateWageStatus(id: string, status: string) {
  const data: any = { status };
  if (status === "COMPLETED") data.paid_at = new Date();
  return prisma.workerWage.update({ where: { id }, data });
}

// ─── Worker Transfers ────────────────────────────────────

export async function getWorkerTransfers(workerId: string) {
  return prisma.workerTransfer.findMany({
    where: { worker_id: workerId },
    include: {
      to_site: { select: { id: true, name: true } },
    },
    orderBy: { transfer_date: "desc" },
  });
}

export async function createWorkerTransfer(
  workerId: string,
  data: z.infer<typeof CreateWorkerTransferSchema>
) {
  // Get worker's current site for from_site_id
  const worker = await prisma.worker.findUnique({
    where: { id: workerId },
    select: { site_id: true },
  });

  // Create transfer and update worker's site in a transaction
  return prisma.$transaction(async (tx) => {
    const transfer = await tx.workerTransfer.create({
      data: {
        worker_id: workerId,
        from_site_id: worker?.site_id,
        to_site_id: data.to_site_id,
        transfer_date: new Date(data.transfer_date),
        reason: data.reason,
      },
      include: {
        to_site: { select: { id: true, name: true } },
      },
    });

    // Update worker's current site
    await tx.worker.update({
      where: { id: workerId },
      data: { site_id: data.to_site_id },
    });

    return transfer;
  });
}

// ─── Worker Emergency Contacts ───────────────────────────

export async function getWorkerEmergencyContacts(workerId: string) {
  return prisma.workerEmergencyContact.findMany({
    where: { worker_id: workerId },
  });
}

export async function createWorkerEmergencyContact(
  workerId: string,
  data: z.infer<typeof CreateWorkerEmergencyContactSchema>
) {
  return prisma.workerEmergencyContact.create({
    data: { worker_id: workerId, ...data },
  });
}

export async function deleteWorkerEmergencyContact(id: string) {
  return prisma.workerEmergencyContact.delete({ where: { id } });
}

// ─── Worker Performance (Computed) ───────────────────────

export async function getWorkerPerformance(workerId: string, days: number = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const attendances = await prisma.workerAttendance.findMany({
    where: {
      worker_id: workerId,
      date: { gte: since },
    },
  });

  const totalDays = days;
  const presentDays = attendances.filter(a => a.status === "PRESENT" || a.status === "HALF_DAY").length;
  const halfDays = attendances.filter(a => a.status === "HALF_DAY").length;
  const lateDays = attendances.filter(a => a.is_late).length;
  const overtimeHours = attendances.reduce((sum, a) => sum + (a.overtime_hours || 0), 0);
  const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  return {
    total_days: totalDays,
    present_days: presentDays,
    absent_days: totalDays - presentDays,
    half_days: halfDays,
    late_days: lateDays,
    overtime_hours: overtimeHours,
    attendance_rate: attendanceRate,
  };
}
