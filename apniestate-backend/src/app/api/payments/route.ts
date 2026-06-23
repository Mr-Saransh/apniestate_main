import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { CreatePaymentSchema } from "@/modules/payments/payments.schema";
import { getPayments, createPayment } from "@/modules/payments/payments.service";
import { ok, created } from "@/lib/response";

export const GET = withAuth(async (req) => {
  const url = new URL(req.url);
  const filters = {
    vendor_id: url.searchParams.get("vendor_id") || undefined,
    contractor_id: url.searchParams.get("contractor_id") || undefined,
    status: url.searchParams.get("status") || undefined,
  };
  const payments = await getPayments(filters);
  return ok(payments);
});

export const POST = withAuth(async (req) => {
  const parsed = await validateBody(req, CreatePaymentSchema);
  if ("error" in parsed) return parsed.error;
  const payment = await createPayment(parsed.data);
  return created(payment, "Payment recorded");
});
