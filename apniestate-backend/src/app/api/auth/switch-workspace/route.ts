import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/middleware/auth.middleware";
import { ok, unauthorized, badRequest } from "@/lib/response";
import { signAccessToken, signRefreshToken } from "@/lib/jwt";
import { hashToken } from "@/modules/auth/token.util";
import { serialize } from "cookie";

export const POST = withAuth(async (req: NextRequest, user) => {
  const body = await req.json();
  const { company_id, role } = body;

  if (!company_id || !role) {
    return badRequest("Missing company_id or role");
  }

  // Verify ACTIVE membership
  const membership = await prisma.companyMembership.findUnique({
    where: { user_id_company_id: { user_id: user.sub, company_id } }
  });

  if (!membership || membership.status !== "ACTIVE" || !membership.roles.includes(role)) {
    return unauthorized();
  }

  // Update active session pointers + last workspace tracking
  const dbUser = await prisma.user.update({
    where: { id: user.sub },
    data: { company_id, role, last_workspace_id: company_id }
  });

  // Update membership last_active_at
  await prisma.companyMembership.update({
    where: { id: membership.id },
    data: { last_active_at: new Date() }
  });

  const accessToken = signAccessToken({ sub: user.sub, email: user.email, role, company_id });
  const refreshToken = signRefreshToken(user.sub);

  const tokenHash = await hashToken(refreshToken);
  await prisma.refreshToken.create({
    data: {
      user_id: user.sub,
      token_hash: tokenHash,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const refreshCookie = serialize("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth",
    maxAge: 7 * 24 * 60 * 60,
  });

  const response = ok(
    {
      accessToken,
      user: {
        id: user.sub,
        name: dbUser.name,
        email: user.email,
        role,
        company_id,
        onboarded: dbUser.onboarded,
        last_workspace_id: company_id,
      },
    },
    "Switched workspace successfully"
  );
  response.headers.set("Set-Cookie", refreshCookie);
  return response;
});
