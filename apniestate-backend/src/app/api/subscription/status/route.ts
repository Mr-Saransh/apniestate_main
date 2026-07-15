import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { getSubscriptionStatus } from "@/modules/subscription/subscription.service";
import { ok } from "@/lib/response";

export const GET = withAuth(async (_req: NextRequest, user) => {
  const status = await getSubscriptionStatus(user.sub);
  return ok(status);
});
