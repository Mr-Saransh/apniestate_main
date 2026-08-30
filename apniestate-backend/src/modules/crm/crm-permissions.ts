import { prisma } from "@/lib/prisma";
import type { JWTPayload, Role } from "@/types";

export type CrmCapability =
  | "CRM_VIEW_ALL_LEADS"
  | "CRM_VIEW_TEAM_LEADS"
  | "CRM_VIEW_OWN_LEADS"
  | "CRM_CREATE_LEAD"
  | "CRM_EDIT_LEAD"
  | "CRM_DELETE_LEAD"
  | "CRM_ASSIGN_LEADS"
  | "CRM_REASSIGN_LEADS"
  | "CRM_CREATE_MANAGER"
  | "CRM_CREATE_TELECALLER"
  | "CRM_MANAGE_TEAM"
  | "CRM_VIEW_TEAM_PIPELINE"
  | "CRM_VIEW_TEAM_REPORTS"
  | "CRM_VIEW_BOOKINGS"
  | "CRM_VIEW_ALL_CUSTOMERS"
  | "CRM_MANAGE_SETTINGS"
  | "CRM_SWITCH_MODE";

export type CrmRole = "BUILDER" | "CRM_MANAGER" | "TELECALLER";

export const CRM_ROLE_CAPABILITIES: Record<CrmRole, CrmCapability[]> = {
  BUILDER: [
    "CRM_VIEW_ALL_LEADS",
    "CRM_VIEW_TEAM_LEADS",
    "CRM_VIEW_OWN_LEADS",
    "CRM_CREATE_LEAD",
    "CRM_EDIT_LEAD",
    "CRM_DELETE_LEAD",
    "CRM_ASSIGN_LEADS",
    "CRM_REASSIGN_LEADS",
    "CRM_CREATE_MANAGER",
    "CRM_CREATE_TELECALLER",
    "CRM_MANAGE_TEAM",
    "CRM_VIEW_TEAM_PIPELINE",
    "CRM_VIEW_TEAM_REPORTS",
    "CRM_VIEW_BOOKINGS",
    "CRM_VIEW_ALL_CUSTOMERS",
    "CRM_MANAGE_SETTINGS",
    "CRM_SWITCH_MODE",
  ],
  CRM_MANAGER: [
    "CRM_VIEW_TEAM_LEADS",
    "CRM_VIEW_OWN_LEADS",
    "CRM_CREATE_LEAD",
    "CRM_EDIT_LEAD",
    "CRM_DELETE_LEAD",
    "CRM_ASSIGN_LEADS",
    "CRM_REASSIGN_LEADS",
    "CRM_CREATE_TELECALLER",
    "CRM_MANAGE_TEAM",
    "CRM_VIEW_TEAM_PIPELINE",
    "CRM_VIEW_TEAM_REPORTS",
    "CRM_VIEW_BOOKINGS",
    "CRM_VIEW_ALL_CUSTOMERS",
  ],
  TELECALLER: [
    "CRM_VIEW_OWN_LEADS",
    "CRM_CREATE_LEAD",
    "CRM_EDIT_LEAD",
    "CRM_VIEW_BOOKINGS",
  ],
};

export function hasCrmCapability(crmRole: CrmRole, capability: CrmCapability): boolean {
  const capabilities = CRM_ROLE_CAPABILITIES[crmRole] || [];
  return capabilities.includes(capability);
}

export interface CrmUserContext {
  userId: string;
  companyId: string;
  crmRole: CrmRole;
  leadScope: "ALL" | "TEAM" | "OWN";
  hasCapability: (capability: CrmCapability) => boolean;
  membershipId?: string;
}

/**
 * Resolves the authenticated user's CRM role in their active company.
 * Strictly checks the user's company membership roles to prevent cross-company leakage.
 */
export async function getCrmUserContext(user: JWTPayload): Promise<CrmUserContext | null> {
  if (!user.company_id) return null;

  // 1. Direct check for ADMIN / BUILDER role at user level
  if (user.role === "ADMIN" || user.role === "BUILDER") {
    return {
      userId: user.sub,
      companyId: user.company_id,
      crmRole: "BUILDER",
      leadScope: "ALL",
      hasCapability: (cap) => hasCrmCapability("BUILDER", cap),
    };
  }

  // 2. Fetch membership in the specific company
  const membership = await prisma.companyMembership.findUnique({
    where: {
      user_id_company_id: {
        user_id: user.sub,
        company_id: user.company_id,
      },
    },
  });

  if (!membership || membership.status !== "ACTIVE") {
    return null;
  }

  const roles = membership.roles || [];

  // Determine CRM role in this specific company
  let crmRole: CrmRole | null = null;
  if (roles.includes("BUILDER") || roles.includes("ADMIN")) {
    crmRole = "BUILDER";
  } else if (roles.includes("CRM_MANAGER")) {
    crmRole = "CRM_MANAGER";
  } else if (roles.includes("TELECALLER") || roles.includes("SALES_EXECUTIVE")) {
    crmRole = "TELECALLER";
  } else if (user.role === "CRM_MANAGER") {
    crmRole = "CRM_MANAGER";
  } else if (user.role === "TELECALLER" || user.role === "SALES_EXECUTIVE") {
    crmRole = "TELECALLER";
  }

  if (!crmRole) {
    return null;
  }

  const leadScope = crmRole === "BUILDER" ? "ALL" : crmRole === "CRM_MANAGER" ? "TEAM" : "OWN";

  return {
    userId: user.sub,
    companyId: user.company_id,
    crmRole,
    leadScope,
    hasCapability: (cap) => hasCrmCapability(crmRole!, cap),
    membershipId: membership.id,
  };
}
