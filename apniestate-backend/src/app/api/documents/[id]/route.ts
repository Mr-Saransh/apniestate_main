import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { UpdateDocumentSchema } from "@/modules/documents/documents.schema";
import { updateDocument, deleteDocument } from "@/modules/documents/documents.service";
import { ok } from "@/lib/response";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = withAuth(async (req: NextRequest, _user: any, context?: Ctx) => {
  const { id } = await context!.params;
  const parsed = await validateBody(req, UpdateDocumentSchema);
  if ("error" in parsed) return parsed.error;
  const item = await updateDocument(id, parsed.data);
  return ok(item, "Document updated");
});

export const DELETE = withAuth(async (_req: NextRequest, _user: any, context?: Ctx) => {
  const { id } = await context!.params;
  await deleteDocument(id);
  return ok(null, "Document deleted");
});
