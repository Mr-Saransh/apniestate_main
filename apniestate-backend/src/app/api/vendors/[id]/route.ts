import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { UpdateVendorSchema } from "@/modules/vendors/vendors.schema";
import { updateVendor, deleteVendor } from "@/modules/vendors/vendors.service";
import { ok } from "@/lib/response";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = withAuth(async (req: NextRequest, user: any, context?: Ctx) => {
  const { id } = await context!.params;
  const parsed = await validateBody(req, UpdateVendorSchema);
  if ("error" in parsed) return parsed.error;
  const item = await updateVendor(id, parsed.data, user.company_id);
  if (!item) return ok(null, "Vendor not found or access denied");
  return ok(item, "Vendor updated");
});

export const DELETE = withAuth(async (_req: NextRequest, user: any, context?: Ctx) => {
  const { id } = await context!.params;
  const success = await deleteVendor(id, user.company_id);
  if (!success) return ok(null, "Vendor not found or access denied");
  return ok(null, "Vendor deleted");
});
