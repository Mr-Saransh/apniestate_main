import { NextRequest } from "next/server";
import { verifyAccessToken } from "@/lib/jwt";
import { unauthorized, forbidden } from "@/lib/response";
import { prisma } from "@/lib/prisma";
import type { JWTPayload } from "@/types";

import { getRolePermissions } from "@/modules/permissions/permissions.service";
import { Role } from "@prisma/client";

type RouteHandler = (req: NextRequest, user: JWTPayload, context?: any) => Promise<Response>;

export function withAuth(handler: RouteHandler) {
  return async (req: NextRequest, context?: any): Promise<Response> => {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];
    if (!token) return unauthorized();

    const payload = verifyAccessToken(token);
    if (!payload) return unauthorized();

    // Database validation to check if the user exists and retrieve company_id
    const dbUser = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { company_id: true }
    });
    if (!dbUser) return unauthorized();

    if (!payload.company_id) {
      payload.company_id = dbUser.company_id || null;
    }

    return handler(req, payload, context);
  };
}

export function withPermission(requiredPermission: string, handler: RouteHandler) {
  return withAuth(async (req, user, context) => {
    if (user.role === "ADMIN") {
      return handler(req, user, context);
    }

    const perms = await getRolePermissions(user.role as Role);
    const hasPerm = perms.some(p => `${p.permission.module}.${p.permission.action}` === requiredPermission);

    if (!hasPerm) {
      return forbidden("You do not have permission to perform this action.");
    }

    return handler(req, user, context);
  });
}
