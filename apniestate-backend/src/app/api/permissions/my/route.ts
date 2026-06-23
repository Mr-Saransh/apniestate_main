import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { getRolePermissions, getAllPermissions } from "@/modules/permissions/permissions.service";
import { ok } from "@/lib/response";

export const GET = withAuth(async (_req, user) => {
  if (user.role === "ADMIN") {
    const all = await getAllPermissions();
    const permissionsList = all.map((p) => `${p.module}.${p.action}`);
    return ok({
      role: user.role,
      permissions: permissionsList,
      isAdmin: true,
    });
  }

  const perms = await getRolePermissions(user.role);
  const permissionsList = perms.map((p) => `${p.permission.module}.${p.permission.action}`);
  return ok({
    role: user.role,
    permissions: permissionsList,
    isAdmin: false,
  });
});
