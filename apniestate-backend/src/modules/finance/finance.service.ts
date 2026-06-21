import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { CreateFinanceSchema, UpdateFinanceSchema } from "./finance.schema";

export async function getFinances(userId: string) {
  return prisma.expense.findMany({
    include: {
      site: { select: { name: true } },
      user: { select: { name: true } }
    },
    orderBy: { date: "desc" }
  });
}

export async function getFinanceById(id: string) {
  return prisma.expense.findUnique({
    where: { id },
    include: {
      site: { select: { name: true } },
      user: { select: { name: true } }
    }
  });
}

export async function createFinance(data: any, userId: string) {
  const expenseDate = data.date ? new Date(data.date) : new Date();
  return prisma.expense.create({
    data: {
      amount: parseFloat(data.amount),
      category: data.category,
      description: data.description,
      site_id: data.site_id || null,
      status: data.status || "PENDING",
      receipt_url: data.receipt_url || null,
      user_id: userId,
      date: expenseDate,
    },
    include: {
      site: { select: { name: true } }
    }
  });
}

export async function updateFinance(id: string, data: any) {
  const updateData: any = { ...data };
  if (data.amount) updateData.amount = parseFloat(data.amount);
  if (data.date) updateData.date = new Date(data.date);
  
  return prisma.expense.update({
    where: { id },
    data: updateData,
    include: {
      site: { select: { name: true } }
    }
  });
}

export async function deleteFinance(id: string) {
  return prisma.expense.delete({ where: { id } });
}
