import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { PaySubscriptionSchema } from "@/modules/subscription/subscription.schema";
import { verifyAndActivateSubscription } from "@/modules/subscription/subscription.service";
import { ok, badRequest, serverError } from "@/lib/response";
import { serialize } from "cookie";

export const POST = withAuth(async (req: NextRequest, user) => {
  const parsed = await validateBody(req, PaySubscriptionSchema);
  if ("error" in parsed) return parsed.error;

  try {
    const result = await verifyAndActivateSubscription(user.sub, parsed.data);

    // Set new access token cookie with updated company_id
    const response = ok(result, "Subscription activated successfully");
    return response;
  } catch (err: any) {
    if (err.message?.includes("verification failed")) {
      return badRequest(err.message);
    }
    console.error("Payment verification error:", err);
    return serverError(err.message || "Failed to verify payment");
  }
});
