import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/middleware/auth.middleware";
import { ok, unauthorized } from "@/lib/response";
import { signAccessToken, signRefreshToken } from "@/lib/jwt";
import { hashToken } from "@/modules/auth/token.util";
import { serialize } from "cookie";

export const POST = withAuth(async (req: NextRequest, user) => {
  // Try to find the last workspace user had active
  const dbUser = await prisma.user.findUnique({
    where: { id: user.sub },
    select: { last_workspace_id: true, name: true, email: true, onboarded: true }
  });

  if (!dbUser || !dbUser.last_workspace_id) {
    // Return flag indicating frontend needs to show workspace selector
    return ok({ needsSelection: true }, "No active workspace to restore");
  }

  // Check if they have an ACTIVE membership for this workspace
  const membership = await prisma.companyMembership.findUnique({
    where: {
      user_id_company_id: {
        user_id: user.sub,
        company_id: dbUser.last_workspace_id
      }
    },
    include: { company: true }
  });

  if (!membership || membership.status !== "ACTIVE") {
    return ok({ needsSelection: true }, "Membership inactive or missing");
  }

  // Use their first role if they somehow don't have one active
  // (In practice, we could store last_role, but using [0] is fine for restoration)
  const role = membership.roles[0];

  // Update membership last_active_at
  await prisma.companyMembership.update({
    where: { id: membership.id },
    data: { last_active_at: new Date() }
  });
  
  // Make sure user record matches this role and company_id
  await prisma.user.update({
    where: { id: user.sub },
    data: { role, company_id: dbUser.last_workspace_id }
  });

  const accessToken = signAccessToken({ sub: user.sub, email: user.email, role, company_id: dbUser.last_workspace_id });
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
      restored: true,
      accessToken,
      user: {
        id: user.sub,
        name: dbUser.name,
        email: dbUser.email,
        role,
        company_id: dbUser.last_workspace_id,
        onboarded: dbUser.onboarded,
        last_workspace_id: dbUser.last_workspace_id,
      },
      company: membership.company,
    },
    "Workspace restored successfully"
  );
  response.headers.set("Set-Cookie", refreshCookie);
  return response;
});
