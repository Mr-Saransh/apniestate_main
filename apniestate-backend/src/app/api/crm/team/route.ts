import { NextRequest } from "next/server";
import { withCrmAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok, badRequest, forbidden, serverError } from "@/lib/response";
import { getCrmUserContext } from "@/modules/crm/crm-permissions";
import { createUser } from "@/modules/users/users.service";

// GET /api/crm/team — list all CRM members for the active company
export const GET = withCrmAuth(async (req, user) => {
  try {
    if (!user.company_id) return badRequest("No company context");

    const crmCtx = await getCrmUserContext(user);
    if (!crmCtx) {
      return forbidden("You do not have CRM permissions in this company.");
    }

    // Telecaller has no team admin access
    if (crmCtx.crmRole === "TELECALLER") {
      return forbidden("Telecallers cannot view CRM team management.");
    }

    const cid = user.company_id;

    // Fetch CRM memberships
    const allMemberships = await prisma.companyMembership.findMany({
      where: {
        company_id: cid,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            created_at: true,
          },
        },
      },
      orderBy: { created_at: "asc" },
    });

    const memberships = allMemberships.filter((m) =>
      m.roles.some((r) => ["BUILDER", "CRM_MANAGER", "TELECALLER", "SALES_EXECUTIVE"].includes(r))
    );

    // Count assigned leads per user in this company
    const leadCounts = await prisma.crmLead.groupBy({
      by: ["assigned_to"],
      where: { company_id: cid, assigned_to: { not: null } },
      _count: true,
    });
    const leadMap = new Map<string, number>();
    leadCounts.forEach((l: any) => {
      if (l.assigned_to) leadMap.set(l.assigned_to, l._count);
    });

    const members = memberships.map((m) => {
      let crmRole = "TELECALLER";
      if (m.roles.includes("BUILDER")) crmRole = "BUILDER";
      else if (m.roles.includes("CRM_MANAGER")) crmRole = "CRM_MANAGER";
      else if (m.roles.includes("TELECALLER") || m.roles.includes("SALES_EXECUTIVE")) crmRole = "TELECALLER";

      return {
        id: m.user.id,
        membership_id: m.id,
        name: m.user.name,
        email: m.user.email,
        phone: m.user.phone,
        crm_role: crmRole,
        roles: m.roles,
        status: m.status,
        assigned_leads_count: leadMap.get(m.user.id) || 0,
        last_active_at: m.last_active_at || m.updated_at,
        created_at: m.created_at,
      };
    });

    return ok({
      members,
      userCrmRole: crmCtx.crmRole,
    });
  } catch (err: any) {
    console.error("CRM Team GET error:", err);
    return serverError(err.message);
  }
});

// POST /api/crm/team — Directly create a CRM team member with ID (Email) & Password
export const POST = withCrmAuth(async (req, user) => {
  try {
    if (!user.company_id) return badRequest("No company context");

    const crmCtx = await getCrmUserContext(user);
    if (!crmCtx) {
      return forbidden("You do not have CRM permissions in this company.");
    }

    const body = await req.json();
    const { name, email, password, role, phone } = body;

    if (!name || !email || !password || !role) {
      return badRequest("Name, Email (ID), Password, and Role are required");
    }

    if (password.length < 6) {
      return badRequest("Password must be at least 6 characters long");
    }

    const targetRole = String(role).toUpperCase();

    // Check authority:
    // Builder can create CRM_MANAGER or TELECALLER
    // CRM Manager can ONLY create TELECALLER / SALES_EXECUTIVE
    if (crmCtx.crmRole === "CRM_MANAGER") {
      if (targetRole !== "TELECALLER" && targetRole !== "SALES_EXECUTIVE") {
        return forbidden("CRM Managers can only create Sales Executives / Telecallers.");
      }
    } else if (crmCtx.crmRole === "BUILDER") {
      if (!["CRM_MANAGER", "TELECALLER", "SALES_EXECUTIVE"].includes(targetRole)) {
        return badRequest("Invalid CRM role. Must be CRM_MANAGER or TELECALLER.");
      }
    } else {
      return forbidden("Telecallers cannot create team members.");
    }

    const createdMember = await createUser(
      {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim(),
        role: targetRole as any,
        phone: phone ? phone.trim() : undefined,
      },
      user.company_id,
      user.sub
    );

    return ok(createdMember, "CRM Team user created successfully with active access");
  } catch (err: any) {
    console.error("CRM Team POST error:", err);
    return badRequest(err.message || "Failed to create team member");
  }
});
