import { NextRequest } from "next/server";
import { SignupSchema } from "@/modules/auth/auth.schema";
import { signupUser } from "@/modules/auth/auth.service";
import { validateBody } from "@/middleware/validate.middleware";
import { ok, conflict } from "@/lib/response";
import { serialize } from "cookie";

export async function POST(req: NextRequest) {
  const parsed = await validateBody(req, SignupSchema);
  if ("error" in parsed) return parsed.error;

  let result;
  try {
    result = await signupUser(parsed.data);
  } catch (error: any) {
    return conflict(error.message);
  }
  if (!result) return conflict("User with this email already exists");

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
    "Signup successful"
  );
  response.headers.set("Set-Cookie", refreshCookie);
  return response;
}
