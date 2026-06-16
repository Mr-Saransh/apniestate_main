import { NextRequest } from "next/server";
import { verifyAccessToken } from "@/lib/jwt";
import { unauthorized } from "@/lib/response";
import type { JWTPayload } from "@/types";

type RouteHandler = (req: NextRequest, user: JWTPayload) => Promise<Response>;

export function withAuth(handler: RouteHandler) {
  return async (req: NextRequest): Promise<Response> => {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];
    if (!token) return unauthorized();

    const payload = verifyAccessToken(token);
    if (!payload) return unauthorized();

    return handler(req, payload);
  };
}
