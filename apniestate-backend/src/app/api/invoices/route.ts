import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { CreateInvoiceSchema } from "@/modules/invoices/invoices.schema";
import { getInvoices, createInvoice } from "@/modules/invoices/invoices.service";
import { ok, created } from "@/lib/response";

export const GET = withAuth(async (req) => {
  const url = new URL(req.url);
  const filters = {
    vendor_id: url.searchParams.get("vendor_id") || undefined,
    status: url.searchParams.get("status") || undefined,
  };
  const invoices = await getInvoices(filters);
  return ok(invoices);
});

export const POST = withAuth(async (req) => {
  const parsed = await validateBody(req, CreateInvoiceSchema);
  if ("error" in parsed) return parsed.error;
  const invoice = await createInvoice(parsed.data);
  return created(invoice, "Invoice created");
});
