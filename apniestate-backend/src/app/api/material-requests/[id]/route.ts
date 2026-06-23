import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { UpdateMaterialRequestSchema } from "../schema";
import { getMaterialRequestById, updateMaterialRequestStatus, deleteMaterialRequest } from "../service";
import { ok, notFound, noContent } from "@/lib/response";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withAuth(async (_req: NextRequest, _user, ctx?: Ctx) => {
  const { id } = await ctx!.params;
  const request = await getMaterialRequestById(id);
  if (!request) return notFound("Material Request");
  return ok(request);
});

export const PATCH = withAuth(async (req: NextRequest, user, ctx?: Ctx) => {
  const { id } = await ctx!.params;
  const parsed = await validateBody(req, UpdateMaterialRequestSchema);
  if ("error" in parsed) return parsed.error;
  const request = await updateMaterialRequestStatus(id, parsed.data, user.sub);
  return ok(request, "Material request updated");
});

export const DELETE = withAuth(async (_req: NextRequest, _user, ctx?: Ctx) => {
  const { id } = await ctx!.params;
  await deleteMaterialRequest(id);
  return noContent();
});
