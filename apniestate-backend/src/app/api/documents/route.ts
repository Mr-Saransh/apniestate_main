import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { CreateDocumentSchema } from "@/modules/documents/documents.schema";
import { getDocuments, createDocument } from "@/modules/documents/documents.service";
import { ok, created } from "@/lib/response";

export const GET = withAuth(async (_req, user) => {
  const items = await getDocuments(user.sub);
  return ok(items);
});

export const POST = withAuth(async (req, user) => {
  const parsed = await validateBody(req, CreateDocumentSchema);
  if ("error" in parsed) return parsed.error;
  const item = await createDocument(parsed.data, user.sub);
  return created(item, "Document created");
});
