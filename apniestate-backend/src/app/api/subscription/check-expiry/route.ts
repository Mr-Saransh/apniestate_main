import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { checkExpiringSubscriptions } from "@/modules/subscription/subscription.service";
import { ok, serverError } from "@/lib/response";

// This endpoint can be called by a cron job to check expiring subscriptions
export const POST = withAuth(async (_req: NextRequest, user) => {
  // Only allow BUILDER/ADMIN roles (or you can restrict further)
  try {
    const result = await checkExpiringSubscriptions();
    return ok(result, "Subscription check completed");
  } catch (err: any) {
    return serverError(err.message || "Failed to check subscriptions");
  }
});
