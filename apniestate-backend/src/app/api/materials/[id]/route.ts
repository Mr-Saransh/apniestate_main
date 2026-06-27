import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { UpdateMaterialSchema } from "@/modules/materials/materials.schema";
import { updateMaterial, deleteMaterial } from "@/modules/materials/materials.service";
import { ok } from "@/lib/response";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = withAuth(async (req: NextRequest, user: any, context?: Ctx) => {
  const { id } = await context!.params;
  const parsed = await validateBody(req, UpdateMaterialSchema);
  if ("error" in parsed) return parsed.error;
  const item = await updateMaterial(id, parsed.data, user.company_id);
  return ok(item, "Material updated");
});

export const DELETE = withAuth(async (_req: NextRequest, user: any, context?: Ctx) => {
  const { id } = await context!.params;
  await deleteMaterial(id, user.company_id);
  return ok(null, "Material deleted");
});
