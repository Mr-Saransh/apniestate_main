import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { getRolePermissions, updateRolePermissions } from "@/modules/permissions/permissions.service";
import { ok, forbidden, badRequest } from "@/lib/response";
import { Role } from "@prisma/client";

type Ctx = { params: Promise<{ role: string }> };

export const GET = withAuth(async (_req: NextRequest, user: any, context?: Ctx) => {
  const { role } = await context!.params;
  const upperRole = role.toUpperCase();
  if (!(upperRole in Role)) {
    return badRequest("Invalid role name");
  }
  const perms = await getRolePermissions(upperRole as Role);
  return ok(perms);
});

export const POST = withAuth(async (req: NextRequest, user: any, context?: Ctx) => {
  if (user.role !== "ADMIN") {
    return forbidden("Only ADMIN can update role permissions");
  }
  const { role } = await context!.params;
  const upperRole = role.toUpperCase();
  if (!(upperRole in Role)) {
    return badRequest("Invalid role name");
  }
  
  const body = await req.json();
  if (!body.permission_ids || !Array.isArray(body.permission_ids)) {
    return badRequest("permission_ids must be an array of string IDs");
  }

  const updated = await updateRolePermissions(upperRole as Role, body.permission_ids);
  return ok(updated, `Permissions updated for role ${upperRole}`);
});
