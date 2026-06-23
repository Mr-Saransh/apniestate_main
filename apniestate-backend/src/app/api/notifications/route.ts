import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { getNotifications, createNotification, markAllAsRead, getUnreadCount } from "@/modules/notifications/notifications.service";
import { checkAndGenerateReminders } from "@/modules/notifications/reminder-engine.service";
import { ok, created } from "@/lib/response";

export const GET = withAuth(async (req, user) => {
  await checkAndGenerateReminders(user.sub);

  const url = new URL(req.url);
  const unreadOnly = url.searchParams.get("unread") === "true";
  const notifications = await getNotifications(user.sub, unreadOnly);
  const unreadCount = await getUnreadCount(user.sub);
  return ok({ notifications, unread_count: unreadCount });
});

export const POST = withAuth(async (req, user) => {
  const body = await req.json();

  // Mark all read action
  if (body.action === "mark_all_read") {
    await markAllAsRead(user.sub);
    return ok(null, "All notifications marked as read");
  }

  // Create notification (admin/system use)
  const notif = await createNotification({
    user_id: body.user_id || user.sub,
    title: body.title,
    message: body.message,
    type: body.type,
    entity_type: body.entity_type,
    entity_id: body.entity_id,
  });
  return created(notif, "Notification created");
});
