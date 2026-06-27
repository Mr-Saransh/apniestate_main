import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { CreateVendorSchema } from "@/modules/vendors/vendors.schema";
import { getVendors, createVendor } from "@/modules/vendors/vendors.service";
import { ok, created } from "@/lib/response";

export const GET = withAuth(async (_req, user) => {
  const items = await getVendors(user.sub, user.company_id);
  return ok(items);
});

export const POST = withAuth(async (req, user) => {
  const parsed = await validateBody(req, CreateVendorSchema);
  if ("error" in parsed) return parsed.error;
  const item = await createVendor(parsed.data, user.sub, user.company_id);
  return created(item, "Vendor created");
});
