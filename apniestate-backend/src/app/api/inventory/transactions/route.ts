import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { CreateInventoryTransactionSchema } from "@/modules/inventory/inventory.schema";
import { createInventoryTransaction } from "@/modules/inventory/inventory.service";
import { created } from "@/lib/response";

export const POST = withAuth(async (req, user) => {
  const parsed = await validateBody(req, CreateInventoryTransactionSchema);
  if ("error" in parsed) return parsed.error;

  const result = await createInventoryTransaction(parsed.data, user.sub);
  return created(result, "Inventory transaction recorded");
});
