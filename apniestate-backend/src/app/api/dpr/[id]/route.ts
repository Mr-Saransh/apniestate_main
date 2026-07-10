import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { UpdateDprSchema } from "@/modules/dpr/dpr.schema";
import { getDprById, updateDpr, deleteDpr } from "@/modules/dpr/dpr.service";
import { ok, notFound } from "@/lib/response";

export const GET = withAuth(async (req: NextRequest, user, { params }: { params: { id: string } }) => {
  const { id } = await params;
  const report = await getDprById(id, user.company_id || undefined);
  if (!report) return notFound("Daily Progress Report not found");
  return ok(report);
});

export const PATCH = withAuth(async (req: NextRequest, user, { params }: { params: { id: string } }) => {
  const { id } = await params;
  
  const parsed = await validateBody(req, UpdateDprSchema);
  if ("error" in parsed) return parsed.error;

  try {
    const updated = await updateDpr(id, parsed.data, user.company_id || undefined);
    return ok(updated);
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: { message: error.message } }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
});

export const DELETE = withAuth(async (req: NextRequest, user, { params }: { params: { id: string } }) => {
  const { id } = await params;
  
  try {
    await deleteDpr(id, user.company_id || undefined);
    return ok({ success: true, message: "DPR deleted successfully" });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: { message: error.message } }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
});
