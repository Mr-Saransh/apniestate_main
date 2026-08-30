import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { ok, badRequest, forbidden } from "@/lib/response";
import { createInvitation, getCompanyInvitations } from "@/modules/invitations/invitations.service";
import { prisma } from "@/lib/prisma";
import { Role } from "@/types";

export const GET = withAuth(async (req, user) => {
  if (!user.company_id) return badRequest("No active company");

  // Check user role in company membership
  const membership = await prisma.companyMembership.findUnique({
    where: {
      user_id_company_id: {
        user_id: user.sub,
        company_id: user.company_id,
      },
    },
  });

  const roles = membership?.roles || [user.role];
  const isBuilder = roles.includes("BUILDER") || roles.includes("ADMIN") || user.role === "BUILDER" || user.role === "ADMIN";
  const isCrmManager = roles.includes("CRM_MANAGER") || user.role === "CRM_MANAGER";

  if (!isBuilder && !isCrmManager) {
    return forbidden("You do not have permission to view company invitations");
  }

  const invitations = await getCompanyInvitations(user.company_id);
  if (!isBuilder && isCrmManager) {
    // Filter to CRM roles for CRM Managers
    return ok(invitations.filter((inv) => ["CRM_MANAGER", "TELECALLER", "SALES_EXECUTIVE"].includes(inv.role)));
  }

  return ok(invitations);
});

export const POST = withAuth(async (req, user) => {
  if (!user.company_id) return badRequest("No active company");

  // Check user role in company membership
  const membership = await prisma.companyMembership.findUnique({
    where: {
      user_id_company_id: {
        user_id: user.sub,
        company_id: user.company_id,
      },
    },
  });

  const roles = membership?.roles || [user.role];
  const isBuilder = roles.includes("BUILDER") || roles.includes("ADMIN") || user.role === "BUILDER" || user.role === "ADMIN";
  const isCrmManager = roles.includes("CRM_MANAGER") || user.role === "CRM_MANAGER";

  if (!isBuilder && !isCrmManager) {
    return forbidden("You do not have permission to invite users");
  }

  const body = await req.json();
  const { email, role, project_ids, site_ids } = body;

  if (!email || !role) return badRequest("Email and role are required");

  const targetRole = String(role).toUpperCase();

  // If CRM Manager, can only invite Telecallers / Sales Executives
  if (!isBuilder && isCrmManager) {
    if (targetRole !== "TELECALLER" && targetRole !== "SALES_EXECUTIVE") {
      return forbidden("CRM Managers can only invite Telecallers / Sales Executives");
    }
  }

  try {
    const invitation = await createInvitation({
      company_id: user.company_id,
      invited_by: user.sub,
      email,
      role: targetRole as Role,
      project_ids: project_ids || [],
      site_ids: site_ids || [],
    });

    return ok(invitation, "Invitation sent successfully");
  } catch (error: any) {
    return badRequest(error.message || "Failed to create invitation");
  }
});
