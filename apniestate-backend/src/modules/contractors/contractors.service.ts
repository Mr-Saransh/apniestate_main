import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { CreateContractorSchema, UpdateContractorSchema } from "./contractors.schema";

export async function getContractors() {
  return prisma.contractor.findMany({
    include: {
      _count: { select: { workers: true, payments: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getContractorById(id: string) {
  return prisma.contractor.findUnique({
    where: { id },
    include: {
      workers: {
        select: { id: true, name: true, trade: true, status: true, daily_rate: true },
      },
      payments: {
        orderBy: { date: "desc" },
        take: 10,
      },
      _count: { select: { workers: true, payments: true } },
    },
  });
}

export async function createContractor(data: z.infer<typeof CreateContractorSchema>) {
  return prisma.contractor.create({ data });
}

export async function updateContractor(id: string, data: z.infer<typeof UpdateContractorSchema>) {
  return prisma.contractor.update({ where: { id }, data });
}

export async function deleteContractor(id: string) {
  return prisma.contractor.update({
    where: { id },
    data: { is_active: false },
  });
}
