import { NextRequest } from "next/server";
import { forbidden } from "@/lib/response";
import { withAuth } from "./auth.middleware";
import type { JWTPayload, Role } from "@/types";

type RouteHandler = (req: NextRequest, user: JWTPayload) => Promise<Response>;

export function withRole(...roles: Role[]) {
  return (handler: RouteHandler) =>
    withAuth(async (req: NextRequest, user: JWTPayload) => {
      if (!roles.includes(user.role)) return forbidden();
      return handler(req, user);
    });
}
