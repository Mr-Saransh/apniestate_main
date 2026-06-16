import { NextRequest } from "next/server";
import { withRole } from "@/middleware/rbac.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { CreateUserSchema } from "@/modules/users/users.schema";
import { getUsers, createUser } from "@/modules/users/users.service";
import { ok, created, conflict, serverError } from "@/lib/response";

export const GET = withRole("BUILDER")(async () => {
  const users = await getUsers();
  return ok(users);
});

export const POST = withRole("BUILDER")(async (req: NextRequest) => {
  const parsed = await validateBody(req, CreateUserSchema);
  if ("error" in parsed) return parsed.error;

  const user = await createUser(parsed.data);
  if (!user) return conflict("Email already in use");

  return created(user, "User created");
});
