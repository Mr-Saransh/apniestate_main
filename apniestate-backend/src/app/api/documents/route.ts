import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { CreateDocumentSchema } from "@/modules/documents/documents.schema";
import { getDocuments, createDocument } from "@/modules/documents/documents.service";
import { ok, created } from "@/lib/response";

export const GET = withAuth(async (req, user) => {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || undefined;
  const tag = searchParams.get("tag") || undefined;
  const entity_type = searchParams.get("entity_type") || undefined;
  const entity_id = searchParams.get("entity_id") || undefined;
  const q = searchParams.get("q") || undefined;

  const items = await getDocuments(user.sub, {
    category,
    tag,
    entity_type,
    entity_id,
    q,
  });
  return ok(items);
});


export const POST = withAuth(async (req, user) => {
  const parsed = await validateBody(req, CreateDocumentSchema);
  if ("error" in parsed) return parsed.error;
  const item = await createDocument(parsed.data, user.sub);
  return created(item, "Document created");
});
