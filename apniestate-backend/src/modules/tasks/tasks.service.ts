import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { CreateTaskSchema, UpdateTaskSchema } from "./tasks.schema";

export async function getTasks(userId: string) {
  // If builder/manager, get all tasks for their projects. 
  // For now, return all tasks where user is assignee or creator, or global if we want a simpler MVP.
  return prisma.task.findMany({
    where: {
      OR: [
        { assignee_id: userId },
        { created_by: userId }
      ]
    },
    include: {
      assignee: { select: { id: true, name: true } },
      creator: { select: { id: true, name: true } },
      site: { select: { id: true, name: true } }
    },
    orderBy: { created_at: "desc" },
  });
}

export async function createTask(data: z.infer<typeof CreateTaskSchema>, userId: string) {
  return prisma.task.create({
    data: {
      ...data,
      created_by: userId,
    },
    include: {
      assignee: { select: { id: true, name: true } },
      creator: { select: { id: true, name: true } },
      site: { select: { id: true, name: true } }
    }
  });
}

export async function updateTask(id: string, data: z.infer<typeof UpdateTaskSchema>) {
  if (data.status === "DONE") {
    (data as any).completed_at = new Date().toISOString();
  }
  return prisma.task.update({
    where: { id },
    data,
    include: {
      assignee: { select: { id: true, name: true } },
      creator: { select: { id: true, name: true } },
      site: { select: { id: true, name: true } }
    }
  });
}

export async function deleteTask(id: string) {
  return prisma.task.delete({
    where: { id },
  });
}
