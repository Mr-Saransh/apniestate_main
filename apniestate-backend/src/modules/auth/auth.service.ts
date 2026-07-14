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

  // Run in a transaction to create User, Company, and Membership atomically
  const { user, company, membership } = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email: input.email,
        password_hash: passwordHash,
        name,
        role: "BUILDER", // Default to builder on sign up
        onboarded: true, // Skip onboarding
      },
    });

    const newCompany = await tx.company.create({
      data: {
        name: `${name}'s Workspace`,
      },
    });

    const newMembership = await tx.companyMembership.create({
      data: {
        user_id: newUser.id,
        company_id: newCompany.id,
        roles: ["BUILDER"],
        status: "ACTIVE",
      },
    });

    // Update user's last workspace
    await tx.user.update({
      where: { id: newUser.id },
      data: { last_workspace_id: newCompany.id },
    });

    return { user: newUser, company: newCompany, membership: newMembership };
  });

  const accessToken = signAccessToken({ sub: user.id, email: user.email || user.username || "", role: user.role as Role, company_id: company.id });
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
      email: user.email || user.username || "",
      role: user.role as Role,
      company_id: company.id,
      onboarded: true,
      last_workspace_id: company.id,
    },
    memberships: [
      {
        id: membership.id,
        user_id: membership.user_id,
        company_id: membership.company_id,
        roles: membership.roles,
        status: membership.status,
        last_active_at: membership.last_active_at,
        company: {
          id: company.id,
          name: company.name,
        },
      },
    ],
  };
}
