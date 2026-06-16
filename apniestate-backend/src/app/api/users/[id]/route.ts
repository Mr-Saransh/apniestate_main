import { NextRequest } from "next/server";
import { withRole } from "@/middleware/rbac.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { UpdateUserSchema } from "@/modules/users/users.schema";
import { getUserById, updateUser, deleteUser } from "@/modules/users/users.service";
import { ok, noContent, notFound, serverError } from "@/lib/response";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withRole("BUILDER")(async (_req: NextRequest, _user, ctx?: Ctx) => {
  const { id } = await ctx!.params;
  const user = await getUserById(id);
  if (!user) return notFound("User");
  return ok(user);
});

export const PATCH = withRole("BUILDER")(async (req: NextRequest, _user, ctx?: Ctx) => {
  const { id } = await ctx!.params;
  const parsed = await validateBody(req, UpdateUserSchema);
  if ("error" in parsed) return parsed.error;

  const user = await updateUser(id, parsed.data);
  return ok(user, "User updated");
});

export const DELETE = withRole("BUILDER")(async (_req: NextRequest, _user, ctx?: Ctx) => {
  const { id } = await ctx!.params;
  await deleteUser(id);
  return noContent();
});
