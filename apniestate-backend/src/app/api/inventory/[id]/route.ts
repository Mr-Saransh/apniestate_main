import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { UpdateInventorySchema } from "@/modules/inventory/inventory.schema";
import { updateInventory, deleteInventory } from "@/modules/inventory/inventory.service";
import { ok } from "@/lib/response";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = withAuth(async (req: NextRequest, _user: any, context?: Ctx) => {
  const { id } = await context!.params;
  const parsed = await validateBody(req, UpdateInventorySchema);
  if ("error" in parsed) return parsed.error;
  const item = await updateInventory(id, parsed.data);
  return ok(item, "Inventory updated");
});

export const DELETE = withAuth(async (_req: NextRequest, _user: any, context?: Ctx) => {
  const { id } = await context!.params;
  await deleteInventory(id);
  return ok(null, "Inventory deleted");
});
