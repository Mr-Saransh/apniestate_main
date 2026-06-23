import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { CreateVersionSchema } from "@/modules/documents/documents.schema";
import { getDocumentVersions, addDocumentVersion } from "@/modules/documents/documents.service";
import { ok, created } from "@/lib/response";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withAuth(async (_req: NextRequest, _user: any, context?: Ctx) => {
  const { id } = await context!.params;
  const versions = await getDocumentVersions(id);
  return ok(versions);
});

export const POST = withAuth(async (req: NextRequest, _user: any, context?: Ctx) => {
  const { id } = await context!.params;
  const parsed = await validateBody(req, CreateVersionSchema);
  if ("error" in parsed) return parsed.error;
  const newVer = await addDocumentVersion(id, parsed.data);
  return created(newVer, "New document version added successfully");
});
