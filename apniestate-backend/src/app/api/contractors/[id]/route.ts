import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { UpdateContractorSchema } from "@/modules/contractors/contractors.schema";
import { getContractorById, updateContractor, deleteContractor } from "@/modules/contractors/contractors.service";
import { ok, notFound, noContent } from "@/lib/response";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withAuth(async (_req: NextRequest, _user, ctx?: Ctx) => {
  const { id } = await ctx!.params;
  const contractor = await getContractorById(id);
  if (!contractor) return notFound("Contractor");
  return ok(contractor);
});

export const PATCH = withAuth(async (req: NextRequest, _user, ctx?: Ctx) => {
  const { id } = await ctx!.params;
  const parsed = await validateBody(req, UpdateContractorSchema);
  if ("error" in parsed) return parsed.error;
  const contractor = await updateContractor(id, parsed.data);
  return ok(contractor, "Contractor updated");
});

export const DELETE = withAuth(async (_req: NextRequest, _user, ctx?: Ctx) => {
  const { id } = await ctx!.params;
  await deleteContractor(id);
  return noContent();
});
