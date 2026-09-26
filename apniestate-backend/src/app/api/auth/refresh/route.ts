import { NextRequest } from "next/server";
import { refreshUserTokens } from "@/modules/auth/auth.service";
import { ok, unauthorized } from "@/lib/response";
import { serialize } from "cookie";

export async function POST(req: NextRequest) {
  // Check cookie, authorization header, or json body
  let token = req.cookies.get("refresh_token")?.value;
  
  if (!token) {
    try {
      const body = await req.json();
      token = body?.refreshToken;
    } catch {}
  }

  if (!token) {
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    return unauthorized("No refresh token provided");
  }

  const result = await refreshUserTokens(token);
  if (!result) {
    return unauthorized("Invalid or expired session. Please log in again.");
  }

  const refreshCookie = serialize("refresh_token", result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });

  const response = ok(
    {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
      memberships: result.memberships,
    },
    "Session refreshed successfully"
  );
  response.headers.set("Set-Cookie", refreshCookie);
  return response;
}
