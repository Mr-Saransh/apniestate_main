import { prisma } from "@/lib/prisma";

export async function createActivityLog(data: {
  user_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  metadata?: any;
}) {
  return prisma.activityLog.create({ data });
}

export async function getActivityLogs(filters?: {
  user_id?: string;
  entity_type?: string;
  entity_id?: string;
  limit?: number;
}) {
  const where: any = {};
  if (filters?.user_id) where.user_id = filters.user_id;
  if (filters?.entity_type) where.entity_type = filters.entity_type;
  if (filters?.entity_id) where.entity_id = filters.entity_id;

  return prisma.activityLog.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, role: true } },
    },
    orderBy: { created_at: "desc" },
    take: filters?.limit || 50,
  });
}
