import bcrypt from "bcryptjs";
import { Role } from "@/types";
import { prisma } from "@/lib/prisma";
import { signAccessToken, signRefreshToken } from "@/lib/jwt";
import { hashToken } from "./token.util";
import type { LoginInput } from "./auth.schema";

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || !user.is_active) return null;

  const valid = await bcrypt.compare(input.password, user.password_hash);
  if (!valid) return null;

  // Fetch all memberships for this user
  const memberships = await prisma.companyMembership.findMany({
    where: { user_id: user.id },
    include: { company: true }
  });

  // We issue a token. If the user doesn't have an active company_id in DB, we don't put one in the token.
  // Actually, we'll put whatever is currently their active pointer.
  const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role as Role, company_id: user.company_id });
  const refreshToken = signRefreshToken(user.id);

  const tokenHash = await hashToken(refreshToken);
  await prisma.refreshToken.create({
    data: {
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return { accessToken, refreshToken, user: { id: user.id, name: user.name, email: user.email, role: user.role as Role, company_id: user.company_id }, memberships };
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

  const user = await prisma.user.create({
    data: {
      email: input.email,
      password_hash: passwordHash,
      name,
    },
  });

  // Check if they have memberships (they shouldn't since they just signed up)
  const memberships = await prisma.companyMembership.findMany({ where: { user_id: user.id } });
  
  const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role as Role, company_id: user.company_id });
  const refreshToken = signRefreshToken(user.id);

  const tokenHash = await hashToken(refreshToken);
  await prisma.refreshToken.create({
    data: {
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return { accessToken, refreshToken, user: { id: user.id, name: user.name, email: user.email, role: user.role as Role, company_id: user.company_id }, memberships: [] };
}
