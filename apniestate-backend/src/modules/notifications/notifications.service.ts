import { prisma } from "@/lib/prisma";

export async function getNotifications(userId: string, onlyUnread?: boolean) {
  const where: any = { user_id: userId };
  if (onlyUnread) where.is_read = false;

  return prisma.notification.findMany({
    where,
    orderBy: { created_at: "desc" },
    take: 50,
  });
}

export async function getUnreadCount(userId: string) {
  return prisma.notification.count({
    where: { user_id: userId, is_read: false },
  });
}

export async function markAsRead(id: string) {
  return prisma.notification.update({
    where: { id },
    data: { is_read: true },
  });
}

export async function markAllAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { user_id: userId, is_read: false },
    data: { is_read: true },
  });
}

export async function createNotification(data: {
  user_id: string;
  title: string;
  message: string;
  type?: string;
  entity_type?: string;
  entity_id?: string;
}) {
  return prisma.notification.create({ data });
}

export async function deleteNotification(id: string) {
  return prisma.notification.delete({ where: { id } });
}

// Helper: Send notification to multiple users
export async function notifyUsers(
  userIds: string[],
  title: string,
  message: string,
  opts?: { type?: string; entity_type?: string; entity_id?: string }
) {
  return prisma.notification.createMany({
    data: userIds.map(user_id => ({
      user_id,
      title,
      message,
      type: opts?.type,
      entity_type: opts?.entity_type,
      entity_id: opts?.entity_id,
    })),
  });
}
