import { NextRequest } from "next/server";
import { LoginSchema } from "@/modules/auth/auth.schema";
import { loginUser } from "@/modules/auth/auth.service";
import { validateBody } from "@/middleware/validate.middleware";
import { ok, badRequest, unauthorized } from "@/lib/response";
import { serialize } from "cookie";
import { signAccessToken, signRefreshToken } from "@/lib/jwt";



export async function POST(req: NextRequest) {
  const parsed = await validateBody(req, LoginSchema);
  if ("error" in parsed) return parsed.error;


  const result = await loginUser(parsed.data);
  if (!result) return unauthorized();

  const refreshCookie = serialize("refresh_token", result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth",
    maxAge: 7 * 24 * 60 * 60,
  });

  const response = ok(
    {
      accessToken: result.accessToken,
      user: result.user,
      memberships: result.memberships,
    },
    "Login successful"
  );
  response.headers.set("Set-Cookie", refreshCookie);
  return response;
}

