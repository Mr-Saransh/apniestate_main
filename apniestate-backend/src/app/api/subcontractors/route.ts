import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { CreateSubContractorSchema } from "@/modules/subcontractors/subcontractors.schema";
import {
  getSubContractors,
  createSubContractor,
} from "@/modules/subcontractors/subcontractors.service";
import { ok, created, forbidden, badRequest } from "@/lib/response";

export const GET = withAuth(async (req: NextRequest, user) => {
  if (user.role === "SUB_CONTRACTOR") {
    return forbidden("Sub contractors must access their dedicated portal.");
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("project_id") || undefined;

  try {
    const list = await getSubContractors(user.company_id || null, projectId);
    return ok(list);
  } catch (error: any) {
    return badRequest(error.message || "Failed to fetch sub contractors");
  }
});

export const POST = withAuth(async (req: NextRequest, user) => {
  if (user.role !== "BUILDER" && user.role !== "ADMIN") {
    return forbidden("Only Builders can create sub contractors.");
  }

  const parsed = await validateBody(req, CreateSubContractorSchema);
  if ("error" in parsed) return parsed.error;

  try {
    const result = await createSubContractor(parsed.data, user.sub, user.company_id || null);
    return created(result, "Sub Contractor created successfully");
  } catch (error: any) {
    return badRequest(error.message || "Failed to create sub contractor");
  }
});
