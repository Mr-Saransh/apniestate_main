import { NextRequest } from "next/server";
import { withPermission } from "@/middleware/permission.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { CreateUserSchema } from "@/modules/users/users.schema";
import { getUsers, createUser } from "@/modules/users/users.service";
import { ok, created, conflict, serverError } from "@/lib/response";

export const GET = withPermission("users", "read")(async (req, user) => {
  const users = await getUsers(user.company_id);
  return ok(users);
});

export const POST = withPermission("users", "create")(async (req: NextRequest, user) => {
  const parsed = await validateBody(req, CreateUserSchema);
  if ("error" in parsed) return parsed.error;

  const newUser = await createUser(parsed.data, user.company_id);
  if (!newUser) return conflict("Email already in use");

  return created(newUser, "User created");
});
