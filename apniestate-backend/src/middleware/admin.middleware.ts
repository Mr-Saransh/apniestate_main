import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { unauthorized } from "@/lib/response";

const ADMIN_JWT_SECRET = process.env.JWT_SECRET! + "_ADMIN_PANEL";

interface AdminPayload {
  sub: string;
  role: string;
  username: string;
}

type AdminRouteHandler = (req: NextRequest, admin: AdminPayload) => Promise<Response>;

export function withAdminAuth(handler: AdminRouteHandler) {
  return async (req: NextRequest): Promise<Response> => {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];
    if (!token) return unauthorized();

    try {
      const payload = jwt.verify(token, ADMIN_JWT_SECRET) as AdminPayload;
      if (payload.role !== "SUPER_ADMIN") return unauthorized();
      return handler(req, payload);
    } catch {
      return unauthorized();
    }
  };
}
