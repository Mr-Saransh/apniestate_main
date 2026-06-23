import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { UpdatePaymentSchema } from "@/modules/payments/payments.schema";
import { getPaymentById, updatePayment, deletePayment } from "@/modules/payments/payments.service";
import { ok, notFound, noContent } from "@/lib/response";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withAuth(async (_req: NextRequest, _user, ctx?: Ctx) => {
  const { id } = await ctx!.params;
  const payment = await getPaymentById(id);
  if (!payment) return notFound("Payment");
  return ok(payment);
});

export const PATCH = withAuth(async (req: NextRequest, _user, ctx?: Ctx) => {
  const { id } = await ctx!.params;
  const parsed = await validateBody(req, UpdatePaymentSchema);
  if ("error" in parsed) return parsed.error;
  const payment = await updatePayment(id, parsed.data);
  return ok(payment, "Payment updated");
});

export const DELETE = withAuth(async (_req: NextRequest, _user, ctx?: Ctx) => {
  const { id } = await ctx!.params;
  await deletePayment(id);
  return noContent();
});
