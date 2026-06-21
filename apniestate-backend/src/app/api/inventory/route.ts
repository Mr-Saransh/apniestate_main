import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { CreateInventorySchema } from "@/modules/inventory/inventory.schema";
import { getInventorys, createInventory } from "@/modules/inventory/inventory.service";
import { ok, created } from "@/lib/response";

export const GET = withAuth(async (_req, user) => {
  const items = await getInventorys(user.sub);
  return ok(items);
});

export const POST = withAuth(async (req, user) => {
  const parsed = await validateBody(req, CreateInventorySchema);
  if ("error" in parsed) return parsed.error;
  const item = await createInventory(parsed.data, user.sub);
  return created(item, "Inventory created");
});
