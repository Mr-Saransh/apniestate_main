import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { CreateSiteSchema } from "@/modules/sites/sites.schema";
import { getSites, createSite } from "@/modules/sites/sites.service";
import { ok, created } from "@/lib/response";

export const GET = withAuth(async (_req, user) => {
  const items = await getSites(user.sub, user.role, user.company_id);
  return ok(items);
});

export const POST = withAuth(async (req, user) => {
  const parsed = await validateBody(req, CreateSiteSchema);
  if ("error" in parsed) return parsed.error;
  const item = await createSite(parsed.data, user.sub, user.company_id);
  return created(item, "Site created");
});
