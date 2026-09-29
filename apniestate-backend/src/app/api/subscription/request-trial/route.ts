import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { requestTrial } from "@/modules/subscription/subscription.service";
import { ok, badRequest } from "@/lib/response";

export const POST = withAuth(async (_req: NextRequest, user) => {
  try {
    const result = await requestTrial(user.sub);
    return ok(result, "15-day Enterprise trial activated successfully");
  } catch (err: any) {
    return badRequest(err.message || "Failed to request trial");
  }
});
