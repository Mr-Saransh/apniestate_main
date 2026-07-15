import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { requestTrial } from "@/modules/subscription/subscription.service";
import { ok, badRequest } from "@/lib/response";

export const POST = withAuth(async (_req: NextRequest, user) => {
  try {
    const subscription = await requestTrial(user.sub);
    return ok(subscription, "Trial request submitted — awaiting admin approval");
  } catch (err: any) {
    return badRequest(err.message || "Failed to request trial");
  }
});
