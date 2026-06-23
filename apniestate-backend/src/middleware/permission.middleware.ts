import { NextRequest } from "next/server";
import { forbidden } from "@/lib/response";
import { withAuth } from "./auth.middleware";
import { prisma } from "@/lib/prisma";
import type { JWTPayload } from "@/types";

type RouteHandler = (req: NextRequest, user: JWTPayload, context?: any) => Promise<Response>;

export function withPermission(module: string, action: string) {
  return (handler: RouteHandler) =>
    withAuth(async (req: NextRequest, user: JWTPayload, context?: any) => {
      // ADMIN bypasses all permission checks
      if (user.role === "ADMIN") {
        return handler(req, user, context);
      }

      // Check if user's role has permission for module.action
      const hasPerm = await prisma.rolePermission.findFirst({
        where: {
          role: user.role,
          permission: {
            module,
            action,
          },
        },
      });

      if (!hasPerm) {
        return forbidden(`You do not have permission to perform this action (${module}.${action})`);
      }

      return handler(req, user, context);
    });
}
