import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { getAllPermissions, seedPermissions } from "@/modules/permissions/permissions.service";
import { ok, forbidden } from "@/lib/response";

export const GET = withAuth(async (req, user) => {
  const perms = await getAllPermissions();
  return ok(perms);
});

export const POST = withAuth(async (req, user) => {
  if (user.role !== "ADMIN") {
    return forbidden("Only ADMIN can seed permissions");
  }
  await seedPermissions();
  return ok(null, "Permissions seeded successfully");
});
