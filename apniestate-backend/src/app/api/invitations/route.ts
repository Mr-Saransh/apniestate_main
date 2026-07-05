import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { ok, badRequest } from "@/lib/response";
import { createInvitation, getCompanyInvitations } from "@/modules/invitations/invitations.service";
import { Role } from "@/types";

export const GET = withAuth(async (req, user) => {
  if (!user.company_id) return badRequest("No active company");
  if (user.role !== "BUILDER" && user.role !== "ADMIN") return badRequest("Only builders can view company invitations");

  const invitations = await getCompanyInvitations(user.company_id);
  return ok(invitations);
});

export const POST = withAuth(async (req, user) => {
  if (!user.company_id) return badRequest("No active company");
  if (user.role !== "BUILDER" && user.role !== "ADMIN") return badRequest("Only builders can invite users");

  const body = await req.json();
  const { email, role, project_ids, site_ids } = body;

  if (!email || !role) return badRequest("Email and role are required");

  try {
    const invitation = await createInvitation({
      company_id: user.company_id,
      invited_by: user.sub,
      email,
      role: role as Role,
      project_ids: project_ids || [],
      site_ids: site_ids || []
    });

    return ok(invitation, "Invitation sent successfully");
  } catch (error: any) {
    return badRequest(error.message || "Failed to create invitation");
  }
});
