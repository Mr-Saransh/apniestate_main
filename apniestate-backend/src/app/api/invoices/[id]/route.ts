import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { UpdateInvoiceSchema } from "@/modules/invoices/invoices.schema";
import { getInvoiceById, updateInvoice, deleteInvoice } from "@/modules/invoices/invoices.service";
import { ok, notFound, noContent } from "@/lib/response";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withAuth(async (_req: NextRequest, _user, ctx?: Ctx) => {
  const { id } = await ctx!.params;
  const invoice = await getInvoiceById(id);
  if (!invoice) return notFound("Invoice");
  return ok(invoice);
});

export const PATCH = withAuth(async (req: NextRequest, _user, ctx?: Ctx) => {
  const { id } = await ctx!.params;
  const parsed = await validateBody(req, UpdateInvoiceSchema);
  if ("error" in parsed) return parsed.error;
  const invoice = await updateInvoice(id, parsed.data);
  return ok(invoice, "Invoice updated");
});

export const DELETE = withAuth(async (_req: NextRequest, _user, ctx?: Ctx) => {
  const { id } = await ctx!.params;
  await deleteInvoice(id);
  return noContent();
});
