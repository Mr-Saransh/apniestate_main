import { NextRequest } from "next/server";
import { withAdminAuth } from "@/middleware/admin.middleware";
import { approveTrial } from "@/modules/subscription/subscription.service";
import { ok, badRequest, serverError } from "@/lib/response";

export const POST = withAdminAuth(async (req: NextRequest, admin) => {
  let body;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid request body");
  }

  const { user_id } = body;
  if (!user_id) return badRequest("user_id is required");

  try {
    const result = await approveTrial(user_id, admin.username);
    return ok(result, "Trial approved — user workspace created");
  } catch (err: any) {
    if (err.message?.includes("No pending trial")) {
      return badRequest(err.message);
    }
    console.error("Approve trial error:", err);
    return serverError(err.message || "Failed to approve trial");
  }
});
