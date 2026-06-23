import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { CreateFinanceSchema, UpdateFinanceSchema } from "./finance.schema";

export async function getExpenses(userId: string, projectId?: string, siteId?: string) {
  const where: any = {};
  if (projectId) where.project_id = projectId;
  if (siteId) where.site_id = siteId;

  return prisma.expense.findMany({
    where,
    include: {
      site: { select: { name: true } },
      user: { select: { name: true } }
    },
    orderBy: { date: "desc" }
  });
}

export async function getExpenseById(id: string) {
  return prisma.expense.findUnique({
    where: { id },
    include: {
      site: { select: { name: true } },
      user: { select: { name: true } }
    }
  });
}

export async function createExpense(data: any, userId: string) {
  const expenseDate = data.date ? new Date(data.date) : new Date();
  
  let projectId = data.project_id;
  if (!projectId && data.site_id) {
    const site = await prisma.site.findUnique({
      where: { id: data.site_id },
      select: { project_id: true }
    });
    projectId = site?.project_id;
  }

  return prisma.expense.create({
    data: {
      amount: parseFloat(data.amount),
      category: data.category,
      description: data.description,
      site_id: data.site_id || null,
      project_id: projectId || null,
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

export async function updateExpense(id: string, data: any) {
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

export async function deleteExpense(id: string) {
  return prisma.expense.delete({ where: { id } });
}
