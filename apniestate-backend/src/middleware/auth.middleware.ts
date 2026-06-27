import { NextRequest } from "next/server";
import { verifyAccessToken } from "@/lib/jwt";
import { unauthorized } from "@/lib/response";
import { prisma } from "@/lib/prisma";
import type { JWTPayload } from "@/types";

type RouteHandler = (req: NextRequest, user: JWTPayload, context?: any) => Promise<Response>;

export function withAuth(handler: RouteHandler) {
  return async (req: NextRequest, context?: any): Promise<Response> => {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];
    if (!token) return unauthorized();

    const payload = verifyAccessToken(token);
    if (!payload) return unauthorized();

    // Database fallback if company_id is not in active token payload or is null
    if (!payload.company_id) {
      const dbUser = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { company_id: true }
      });
      payload.company_id = dbUser?.company_id || null;
    }

    return handler(req, payload, context);
  };
}
