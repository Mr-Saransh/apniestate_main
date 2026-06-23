import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { markAsRead, deleteNotification } from "@/modules/notifications/notifications.service";
import { ok, noContent } from "@/lib/response";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = withAuth(async (_req: NextRequest, _user, ctx?: Ctx) => {
  const { id } = await ctx!.params;
  const notif = await markAsRead(id);
  return ok(notif, "Notification marked as read");
});

export const DELETE = withAuth(async (_req: NextRequest, _user, ctx?: Ctx) => {
  const { id } = await ctx!.params;
  await deleteNotification(id);
  return noContent();
});
