import { NextRequest } from "next/server";
import { withPermission } from "@/middleware/permission.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { UpdateUserSchema } from "@/modules/users/users.schema";
import { getUserById, updateUser, deleteUser } from "@/modules/users/users.service";
import { ok, noContent, notFound, serverError } from "@/lib/response";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withPermission("users", "read")(async (_req: NextRequest, user, ctx?: Ctx) => {
  const { id } = await ctx!.params;
  const dbUser = await getUserById(id, user.company_id);
  if (!dbUser) return notFound("User");
  return ok(dbUser);
});

export const PATCH = withPermission("users", "update")(async (req: NextRequest, user, ctx?: Ctx) => {
  const { id } = await ctx!.params;
  const parsed = await validateBody(req, UpdateUserSchema);
  if ("error" in parsed) return parsed.error;

  const dbUser = await updateUser(id, parsed.data, user.company_id);
  if (!dbUser) return notFound("User");
  return ok(dbUser, "User updated");
});

export const DELETE = withPermission("users", "delete")(async (_req: NextRequest, user, ctx?: Ctx) => {
  const { id } = await ctx!.params;
  const success = await deleteUser(id, user.company_id);
  if (!success) return notFound("User");
  return noContent();
});
