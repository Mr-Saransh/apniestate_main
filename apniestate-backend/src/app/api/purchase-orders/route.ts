import { withAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { CreatePurchaseOrderSchema } from "@/modules/purchase-orders/purchase-orders.schema";
import { getPurchaseOrders, createPurchaseOrder } from "@/modules/purchase-orders/purchase-orders.service";
import { ok, created } from "@/lib/response";

export const GET = withAuth(async (req, user) => {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("project_id");
  if (!projectId) return Response.json({ message: "project_id is required" }, { status: 400 });
  
  const pos = await getPurchaseOrders(user.company_id || undefined, projectId);
  return ok(pos);
});

export const POST = withAuth(async (req, user) => {
  const parsed = await validateBody(req, CreatePurchaseOrderSchema);
  if ("error" in parsed) return parsed.error;
  
  if (!user.company_id) return Response.json({ message: "Company ID required" }, { status: 400 });
  const po = await createPurchaseOrder(parsed.data, user.sub, user.company_id);
  return created(po, "Purchase Order created");
});
