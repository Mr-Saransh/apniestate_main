import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { updateUser } from "@/modules/users/users.service";
import { ok, badRequest } from "@/lib/response";

export const PATCH = withAuth(async (req: NextRequest, user) => {
  const body = await req.json().catch(() => ({}));

  if (!body.role) {
    return badRequest("Role is required");
  }

  const validRoles = ["ADMIN", "BUILDER", "SITE_SUPERVISOR", "ACCOUNTANT", "INVENTORY_MANAGER", "PROJECT_MANAGER"];
  if (!validRoles.includes(body.role)) {
    return badRequest(`Invalid role. Must be one of: ${validRoles.join(", ")}`);
  }

  const updated = await updateUser(user.sub, { role: body.role });
  return ok(updated, "Role updated successfully");
});
