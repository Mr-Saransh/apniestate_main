import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { CreateInventorySchema } from "@/modules/inventory/inventory.schema";
import { getInventoryItems, createInventory } from "@/modules/inventory/inventory.service";
import { ok, created } from "@/lib/response";

export const GET = withAuth(async (req, user) => {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("project_id") || undefined;
  const items = await getInventoryItems(user.sub, user.role, projectId);
  return ok(items);
});

export const POST = withAuth(async (req, user) => {
  const parsed = await validateBody(req, CreateInventorySchema);
  if ("error" in parsed) return parsed.error;
  const item = await createInventory(parsed.data, user.sub);
  return created(item, "Inventory created");
});
