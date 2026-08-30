import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { RenewSubscriptionSchema } from "@/modules/subscription/subscription.schema";
import { renewSubscription, createRazorpayOrder } from "@/modules/subscription/subscription.service";
import { ok, badRequest, serverError } from "@/lib/response";

// GET: Create Razorpay order for renewal
export const GET = withAuth(async (req: NextRequest, _user) => {
  try {
    const url = new URL(req.url);
    const planId = (url.searchParams.get("plan_id") as any) || "PLAN_30K";
    const durationMonths = parseInt(url.searchParams.get("duration_months") || "4", 10);

    const order = await createRazorpayOrder({
      plan_id: planId,
      duration_months: durationMonths,
    });
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
    const result = await renewSubscription(user.sub, parsed.data, user.company_id);
    return ok(result, "Subscription renewed successfully");
  } catch (err: any) {
    if (err.message?.includes("verification failed")) {
      return badRequest(err.message);
    }
    return serverError(err.message || "Failed to renew subscription");
  }
});
