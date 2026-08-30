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

  if (input.otp) {
    const otpRecord = await prisma.otpVerification.findFirst({
      where: { email: user.email!, otp: input.otp }
    });
    if (!otpRecord || otpRecord.expires_at < new Date()) {
      throw new Error("Invalid or expired OTP");
    }
    await prisma.otpVerification.delete({ where: { id: otpRecord.id } });
  } else if (input.password) {
    const valid = await bcrypt.compare(input.password, user.password_hash);
    if (!valid) return null;
  } else {
    return null;
  }

  // Fetch all ACTIVE memberships for this user
  const memberships = await prisma.companyMembership.findMany({
    where: { user_id: user.id, status: "ACTIVE" },
    include: { company: true }
  });

  const currentMembership = memberships.find((m) => m.company_id === user.company_id);
  const allCompanyRoles = currentMembership ? currentMembership.roles : [user.role];
  const hasBuilder = allCompanyRoles.includes("BUILDER") || allCompanyRoles.includes("ADMIN") || user.role === "BUILDER" || user.role === "ADMIN";
  const hasCrmRole = allCompanyRoles.includes("CRM_MANAGER") || allCompanyRoles.includes("TELECALLER") || allCompanyRoles.includes("SALES_EXECUTIVE") || user.role === "CRM_MANAGER" || user.role === "TELECALLER" || user.role === "SALES_EXECUTIVE";
  const hasErpRole = allCompanyRoles.some((r) => ["BUILDER", "ADMIN", "SITE_SUPERVISOR", "ACCOUNTANT", "INVENTORY_MANAGER", "PROJECT_MANAGER", "WORKER"].includes(r)) || ["BUILDER", "ADMIN", "SITE_SUPERVISOR", "ACCOUNTANT", "INVENTORY_MANAGER", "PROJECT_MANAGER", "WORKER"].includes(user.role);

  let activeCrmRole: "BUILDER" | "CRM_MANAGER" | "TELECALLER" | null = null;
  if (hasBuilder) {
    activeCrmRole = "BUILDER";
  } else if (allCompanyRoles.includes("CRM_MANAGER") || user.role === "CRM_MANAGER") {
    activeCrmRole = "CRM_MANAGER";
  } else if (allCompanyRoles.includes("TELECALLER") || allCompanyRoles.includes("SALES_EXECUTIVE") || user.role === "TELECALLER" || user.role === "SALES_EXECUTIVE") {
    activeCrmRole = "TELECALLER";
  }

  let activeRole = user.role;
  if (hasBuilder) {
    activeRole = "BUILDER" as any;
  } else if (currentMembership && currentMembership.roles.length > 0) {
    const erpRole = currentMembership.roles.find((r) => ["PROJECT_MANAGER", "SITE_SUPERVISOR", "ACCOUNTANT", "INVENTORY_MANAGER", "WORKER"].includes(r));
    if (erpRole) {
      activeRole = erpRole as any;
    } else {
      activeRole = currentMembership.roles[0] as any;
    }
  }

  const canSwitchMode = hasBuilder || (hasErpRole && Boolean(activeCrmRole));

  // Issue token with active company role and CRM role
  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email || user.username || "",
    role: activeRole as Role,
    crm_role: activeCrmRole,
    company_id: user.company_id,
  });
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
      role: activeRole as Role,
      crm_role: activeCrmRole,
      company_roles: allCompanyRoles,
      can_switch_mode: canSwitchMode,
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

  const otpRecord = await prisma.otpVerification.findFirst({
    where: { email: input.email, otp: input.otp }
  });
  if (!otpRecord || otpRecord.expires_at < new Date()) {
    throw new Error("Invalid or expired OTP");
  }
  await prisma.otpVerification.delete({ where: { id: otpRecord.id } });

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
