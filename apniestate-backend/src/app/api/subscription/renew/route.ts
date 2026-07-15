import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { RenewSubscriptionSchema } from "@/modules/subscription/subscription.schema";
import { renewSubscription, createRazorpayOrder } from "@/modules/subscription/subscription.service";
import { ok, badRequest, serverError } from "@/lib/response";

// GET: Create Razorpay order for renewal
export const GET = withAuth(async (_req: NextRequest, _user) => {
  try {
    const order = await createRazorpayOrder();
    return ok(order, "Renewal order created");
  } catch (err: any) {
    return serverError(err.message || "Failed to create renewal order");
  }
});

// POST: Verify payment and renew
export const POST = withAuth(async (req: NextRequest, user) => {
  const parsed = await validateBody(req, RenewSubscriptionSchema);
  if ("error" in parsed) return parsed.error;

  try {
    const result = await renewSubscription(user.sub, parsed.data);
    return ok(result, "Subscription renewed successfully");
  } catch (err: any) {
    if (err.message?.includes("verification failed")) {
      return badRequest(err.message);
    }
    return serverError(err.message || "Failed to renew subscription");
  }
});
