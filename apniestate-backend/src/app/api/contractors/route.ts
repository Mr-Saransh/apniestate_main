import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { CreateContractorSchema } from "@/modules/contractors/contractors.schema";
import { getContractors, createContractor } from "@/modules/contractors/contractors.service";
import { ok, created } from "@/lib/response";

export const GET = withAuth(async () => {
  const contractors = await getContractors();
  return ok(contractors);
});

export const POST = withAuth(async (req) => {
  const parsed = await validateBody(req, CreateContractorSchema);
  if ("error" in parsed) return parsed.error;
  const contractor = await createContractor(parsed.data);
  return created(contractor, "Contractor created");
});
