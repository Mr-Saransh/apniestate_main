import { NextRequest } from "next/server";
import { withAdminAuth } from "@/middleware/admin.middleware";
import { getAllUsersForAdmin } from "@/modules/subscription/subscription.service";
import { ok, serverError } from "@/lib/response";

export const GET = withAdminAuth(async (_req: NextRequest, _admin) => {
  try {
    const users = await getAllUsersForAdmin();
    return ok(users);
  } catch (err: any) {
    console.error("Admin users fetch error:", err);
    return serverError(err.message || "Failed to fetch users");
  }
});
