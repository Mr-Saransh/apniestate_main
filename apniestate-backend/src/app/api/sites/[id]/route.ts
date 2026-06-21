import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { UpdateSiteSchema } from "@/modules/sites/sites.schema";
import { updateSite, deleteSite } from "@/modules/sites/sites.service";
import { ok } from "@/lib/response";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = withAuth(async (req: NextRequest, _user: any, context?: Ctx) => {
  const { id } = await context!.params;
  const parsed = await validateBody(req, UpdateSiteSchema);
  if ("error" in parsed) return parsed.error;
  const item = await updateSite(id, parsed.data);
  return ok(item, "Site updated");
});

export const DELETE = withAuth(async (_req: NextRequest, _user: any, context?: Ctx) => {
  const { id } = await context!.params;
  await deleteSite(id);
  return ok(null, "Site deleted");
});
