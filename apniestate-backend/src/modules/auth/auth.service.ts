import bcrypt from "bcryptjs";
import { Role } from "@/types";
import { prisma } from "@/lib/prisma";
import { signAccessToken, signRefreshToken } from "@/lib/jwt";
import { hashToken } from "./token.util";
import type { LoginInput } from "./auth.schema";

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: input.identifier },
        { username: input.identifier }
      ]
    }
  });
  if (!user || !user.is_active) return null;

  const valid = await bcrypt.compare(input.password, user.password_hash);
  if (!valid) return null;

  // Fetch all ACTIVE memberships for this user
  const memberships = await prisma.companyMembership.findMany({
    where: { user_id: user.id, status: "ACTIVE" },
    include: { company: true }
  });

  // Issue token with whatever is currently the user's active pointer
  const accessToken = signAccessToken({ sub: user.id, email: user.email || user.username || "", role: user.role as Role, company_id: user.company_id });
  const refreshToken = signRefreshToken(user.id);

  const tokenHash = await hashToken(refreshToken);
  await prisma.refreshToken.create({
    data: {
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  let effectiveSubscriptionStatus = user.subscription_status;
  
  const identifier = user.email || user.username || "";
  const demoAccounts = ["admin@gmail.com", "site@gmail.com", "pm1@apniestate.com", "accounts@apniestate.com"];
  
  if (demoAccounts.includes(identifier)) {
    effectiveSubscriptionStatus = "ACTIVE" as any;
  } else if (user.role !== "BUILDER" && user.company_id) {
    const builder = await prisma.user.findFirst({
      where: {
        company_id: user.company_id,
        role: "BUILDER"
      }
    });
    if (builder) {
      effectiveSubscriptionStatus = builder.subscription_status;
    }
  }

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email || user.username || "",
      role: user.role as Role,
      company_id: user.company_id,
      onboarded: user.onboarded,
      last_workspace_id: user.last_workspace_id,
      profile_completed: user.profile_completed,
      subscription_status: effectiveSubscriptionStatus,
      phone: user.phone,
      city: user.city,
      state: user.state,
    },
    memberships: memberships.map(m => ({
      id: m.id,
      user_id: m.user_id,
      company_id: m.company_id,
      roles: m.roles,
      status: m.status,
      last_active_at: m.last_active_at,
      company: {
        id: m.company.id,
        name: m.company.name,
      }
    })),
  };
}

export async function logoutUser(userId: string, tokenId?: string) {
  if (tokenId) {
    await prisma.refreshToken.update({ where: { id: tokenId }, data: { revoked: true } });
  } else {
    await prisma.refreshToken.updateMany({ where: { user_id: userId }, data: { revoked: true } });
  }
}

export async function signupUser(input: import("./auth.schema").SignupInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) return null;

  const passwordHash = await bcrypt.hash(input.password, 10);
  const name = input.email.split("@")[0];

  // Create user only — NO company/workspace yet.
  // User must complete profile + subscribe before getting a workspace.
  const user = await prisma.user.create({
    data: {
      email: input.email,
      password_hash: passwordHash,
      name,
      role: "BUILDER",
      onboarded: false,
      profile_completed: false,
      subscription_status: "NONE",
    },
  });

  const accessToken = signAccessToken({ sub: user.id, email: user.email || "", role: user.role as Role, company_id: null });
  const refreshToken = signRefreshToken(user.id);

  const tokenHash = await hashToken(refreshToken);
  await prisma.refreshToken.create({
    data: {
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email || "",
      role: user.role as Role,
      company_id: null,
      onboarded: false,
      last_workspace_id: null,
      profile_completed: false,
      subscription_status: "NONE" as const,
      phone: null,
      city: null,
      state: null,
    },
    memberships: [],
  };
}
