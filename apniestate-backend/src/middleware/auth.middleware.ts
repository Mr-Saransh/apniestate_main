import { NextRequest } from "next/server";
import { verifyAccessToken } from "@/lib/jwt";
import { unauthorized, forbidden } from "@/lib/response";
import { prisma } from "@/lib/prisma";
import type { JWTPayload } from "@/types";
import { getRolePermissions } from "@/modules/permissions/permissions.service";
import { canAccessCRM } from "@/modules/subscription/entitlement.service";
import { Role } from "@prisma/client";

type RouteHandler = (req: NextRequest, user: JWTPayload, context?: any) => Promise<Response>;

export function withAuth(handler: RouteHandler) {
  return async (req: NextRequest, context?: any): Promise<Response> => {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];
    if (!token) return unauthorized();

    const payload = verifyAccessToken(token);
    if (!payload) return unauthorized();

    // Database validation to check if the user exists and retrieve company_id
    let dbUser = null;
    try {
      dbUser = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { company_id: true, name: true, role: true, subscription_status: true },
      });
    } catch (e) {
      console.warn("Transient DB error in auth middleware", e);
      dbUser = { company_id: payload.company_id || null, name: "User", role: payload.role, subscription_status: "NONE" };
    }

    if (!dbUser && !payload.company_id) return unauthorized();

    // Keep payload.company_id synced with DB record
    if (dbUser?.company_id) {
      payload.company_id = dbUser.company_id;
    } else {
      // Check active membership
      const membership = await prisma.companyMembership.findFirst({
        where: { user_id: payload.sub, status: "ACTIVE" },
        select: { company_id: true },
      });
      if (membership?.company_id) {
        payload.company_id = membership.company_id;
        await prisma.user.update({
          where: { id: payload.sub },
          data: { company_id: membership.company_id },
        }).catch(() => {});
      } else if (dbUser && (dbUser.subscription_status === "TRIAL_ACTIVE" || dbUser.subscription_status === "ACTIVE")) {
        // Auto-provision workspace for active trial/paid builder
        const company = await prisma.company.create({
          data: { name: `${dbUser.name || "User"}'s Workspace` },
        });
        payload.company_id = company.id;
        await prisma.companyMembership.create({
          data: { user_id: payload.sub, company_id: company.id, roles: ["BUILDER"], status: "ACTIVE" },
        });
        await prisma.user.update({
          where: { id: payload.sub },
          data: { company_id: company.id },
        });
      }
    }

    return handler(req, payload, context);
  };
}

export function withPermission(requiredPermission: string, handler: RouteHandler) {
  return withAuth(async (req, user, context) => {
    if (user.role === "ADMIN") {
      return handler(req, user, context);
    }

    const perms = await getRolePermissions(user.role as Role);
    const hasPerm = perms.some((p) => `${p.permission.module}.${p.permission.action}` === requiredPermission);

    if (!hasPerm) {
      return forbidden("You do not have permission to perform this action.");
    }

    return handler(req, user, context);
  });
}

/**
 * Middleware wrapper enforcing CRM entitlement check (Enterprise Plan / Active Trial required).
 */
export function withCrmAuth(handler: RouteHandler) {
  return withAuth(async (req, user, context) => {
    const crmAccess = await canAccessCRM(user.company_id, user.sub);
    if (!crmAccess.allowed) {
      return forbidden(
        crmAccess.reason || "CRM is available exclusively on the Enterprise Plan. Upgrade your subscription to access CRM features."
      );
    }

    return handler(req, user, context);
  });
}
