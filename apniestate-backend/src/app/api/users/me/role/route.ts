import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { updateUser } from "@/modules/users/users.service";
import { ok, badRequest } from "@/lib/response";

export const PATCH = withAuth(async (req: NextRequest, user) => {
  const body = await req.json().catch(() => ({}));

  if (!body.role) {
    return badRequest("Role is required");
  }

  // Currently restricting onboarding to Site Supervisor as per requirements
  if (body.role !== "SITE_SUPERVISOR") {
    return badRequest("Only Site Supervisor role is available for self-registration right now.");
  }

  // The JWT payload stores the user ID in the 'sub' field
  const updated = await updateUser(user.sub, { role: body.role });
  return ok(updated, "Role updated successfully");
});
