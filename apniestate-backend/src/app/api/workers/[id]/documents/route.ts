import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { CreateWorkerDocumentSchema } from "@/modules/workers/workers.schema";
import { getWorkerDocuments, createWorkerDocument } from "@/modules/workers/workers.service";
import { ok, created } from "@/lib/response";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withAuth(async (_req: NextRequest, _user, ctx?: Ctx) => {
  const { id } = await ctx!.params;
  const docs = await getWorkerDocuments(id);
  return ok(docs);
});

export const POST = withAuth(async (req: NextRequest, _user, ctx?: Ctx) => {
  const { id } = await ctx!.params;
  const parsed = await validateBody(req, CreateWorkerDocumentSchema);
  if ("error" in parsed) return parsed.error;
  const doc = await createWorkerDocument(id, parsed.data);
  return created(doc, "Worker document added");
});
