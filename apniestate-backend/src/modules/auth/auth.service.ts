import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signAccessToken, signRefreshToken } from "@/lib/jwt";
import { hashToken } from "./token.util";
import type { LoginInput } from "./auth.schema";

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || !user.is_active) return null;

  const valid = await bcrypt.compare(input.password, user.password_hash);
  if (!valid) return null;

  const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });
  const refreshToken = signRefreshToken(user.id);

  const tokenHash = await hashToken(refreshToken);
  await prisma.refreshToken.create({
    data: {
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return { accessToken, refreshToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
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

  const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });
  const refreshToken = signRefreshToken(user.id);

  const tokenHash = await hashToken(refreshToken);
  await prisma.refreshToken.create({
    data: {
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return { accessToken, refreshToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
}
