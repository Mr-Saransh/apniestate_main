import { NextRequest } from "next/server";
import { withAdminAuth } from "@/middleware/admin.middleware";
import { rejectTrial } from "@/modules/subscription/subscription.service";
import { ok, badRequest, serverError } from "@/lib/response";

export const POST = withAdminAuth(async (req: NextRequest, _admin) => {
  let body;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid request body");
  }

  const { user_id } = body;
  if (!user_id) return badRequest("user_id is required");

  try {
    await rejectTrial(user_id);
    return ok(null, "Trial request rejected");
  } catch (err: any) {
    console.error("Reject trial error:", err);
    return serverError(err.message || "Failed to reject trial");
  }
});
