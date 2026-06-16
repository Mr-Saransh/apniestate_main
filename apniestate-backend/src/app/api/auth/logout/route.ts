import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { logoutUser } from "@/modules/auth/auth.service";
import { ok } from "@/lib/response";
import { serialize } from "cookie";

export const POST = withAuth(async (_req: NextRequest, user) => {
  await logoutUser(user.sub);

  const clearCookie = serialize("refresh_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth",
    maxAge: 0,
  });

  const response = ok(null, "Logged out successfully");
  response.headers.set("Set-Cookie", clearCookie);
  return response;
});
