import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { CreateLeaveSchema, UpdateLeaveSchema } from "./leaves.schema";

export async function getLeaves(filters?: { worker_id?: string; status?: string }) {
  const where: any = {};
  if (filters?.worker_id) where.worker_id = filters.worker_id;
  if (filters?.status) where.status = filters.status;

  return prisma.leave.findMany({
    where,
    include: {
      worker: { select: { id: true, name: true, trade: true } },
      approver: { select: { id: true, name: true } },
    },
    orderBy: { created_at: "desc" },
  });
}

export async function getLeaveById(id: string) {
  return prisma.leave.findUnique({
    where: { id },
    include: {
      worker: { select: { id: true, name: true, trade: true } },
      approver: { select: { id: true, name: true } },
    },
  });
}

export async function createLeave(data: z.infer<typeof CreateLeaveSchema>) {
  return prisma.leave.create({
    data: {
      worker_id: data.worker_id,
      type: data.type,
      from_date: new Date(data.from_date),
      to_date: new Date(data.to_date),
      reason: data.reason,
    },
    include: {
      worker: { select: { id: true, name: true } },
    },
  });
}

export async function updateLeaveStatus(
  id: string,
  data: z.infer<typeof UpdateLeaveSchema>,
  userId: string
) {
  const updateData: any = { status: data.status };
  if (data.status === "APPROVED") {
    updateData.approved_by = userId;
    updateData.approved_at = new Date();
  }
  return prisma.leave.update({
    where: { id },
    data: updateData,
    include: {
      worker: { select: { id: true, name: true } },
      approver: { select: { id: true, name: true } },
    },
  });
}

export async function deleteLeave(id: string) {
  return prisma.leave.delete({ where: { id } });
}
