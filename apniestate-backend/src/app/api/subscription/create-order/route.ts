import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { createRazorpayOrder } from "@/modules/subscription/subscription.service";
import { CreateOrderSchema } from "@/modules/subscription/subscription.schema";
import { ok, badRequest, serverError } from "@/lib/response";

export const POST = withAuth(async (req: NextRequest, _user) => {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = CreateOrderSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message || "Invalid order parameters");
    }

    const order = await createRazorpayOrder(parsed.data);
    return ok(order, "Razorpay order created");
  } catch (err: any) {
    console.error("Failed to create Razorpay order:", err);
    return serverError(err.message || "Failed to create payment order");
  }
});
