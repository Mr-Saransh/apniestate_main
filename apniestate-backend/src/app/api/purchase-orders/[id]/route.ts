import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { UpdatePurchaseOrderStatusSchema } from "@/modules/purchase-orders/purchase-orders.schema";
import { getPurchaseOrderById, updatePurchaseOrderStatus } from "@/modules/purchase-orders/purchase-orders.service";
import { ok } from "@/lib/response";

export const GET = withAuth(async (_req, user, { params }) => {
  const po = await getPurchaseOrderById(params.id, user.company_id || undefined);
  return ok(po);
});

export const PATCH = withAuth(async (req, user, { params }) => {
  const parsed = await validateBody(req, UpdatePurchaseOrderStatusSchema);
  if ("error" in parsed) return parsed.error;
  
  const po = await updatePurchaseOrderStatus(params.id, parsed.data, user.company_id || undefined);
  return ok(po, "Purchase Order status updated");
});
