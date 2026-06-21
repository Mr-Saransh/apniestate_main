import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { CreateMaterialSchema } from "@/modules/materials/materials.schema";
import { getMaterials, createMaterial } from "@/modules/materials/materials.service";
import { ok, created } from "@/lib/response";

export const GET = withAuth(async (_req, user) => {
  const items = await getMaterials(user.sub);
  return ok(items);
});

export const POST = withAuth(async (req, user) => {
  const parsed = await validateBody(req, CreateMaterialSchema);
  if ("error" in parsed) return parsed.error;
  const item = await createMaterial(parsed.data, user.sub);
  return created(item, "Material created");
});
