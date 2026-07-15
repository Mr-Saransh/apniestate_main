import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { createRazorpayOrder } from "@/modules/subscription/subscription.service";
import { ok, serverError } from "@/lib/response";

export const POST = withAuth(async (_req: NextRequest, _user) => {
  try {
    const order = await createRazorpayOrder();
    return ok(order, "Razorpay order created");
  } catch (err: any) {
    console.error("Failed to create Razorpay order:", err);
    return serverError(err.message || "Failed to create payment order");
  }
});
