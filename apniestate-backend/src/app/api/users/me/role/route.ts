import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
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

  const updated = await prisma.user.update({ 
    where: { id: user.sub },
    data: { role: body.role }
  });
  
  const { signAccessToken } = await import("@/lib/jwt");
  const newToken = signAccessToken({
    sub: updated.id,
    email: updated.email || updated.username || "",
    role: updated.role as any,
    company_id: updated.company_id,
  });

  return ok({ user: updated, accessToken: newToken }, "Role updated successfully");
});
