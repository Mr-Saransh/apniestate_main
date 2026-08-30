import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { getCompanyEntitlements } from "@/modules/subscription/entitlement.service";
import { ok } from "@/lib/response";

export const GET = withAuth(async (_req: NextRequest, user) => {
  const entitlements = await getCompanyEntitlements(user.company_id);
  return ok(entitlements, "Company entitlements retrieved");
});
