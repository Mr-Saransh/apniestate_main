import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/middleware/auth.middleware";
import { ok, badRequest } from "@/lib/response";
import { signAccessToken } from "@/lib/jwt";

export const POST = withAuth(async (req: NextRequest, user) => {
  const body = await req.json();
  const { name } = body; // Role is always BUILDER for company creation

  if (!name) {
    return badRequest("Company name is required");
  }

  // Create company
  const company = await prisma.company.create({
    data: { name }
  });

  // Assign user to this company with BUILDER role, active status
  const membership = await prisma.companyMembership.create({
    data: {
      user_id: user.sub,
      company_id: company.id,
      roles: ["BUILDER"],
      status: "ACTIVE",
      last_active_at: new Date()
    }
  });

  // Automatically switch them to the new workspace and mark onboarded
  const updated = await prisma.user.update({
    where: { id: user.sub },
    data: { 
      company_id: company.id, 
      role: "BUILDER",
      last_workspace_id: company.id,
      onboarded: true
    }
  });

  // Re-sign JWT with new company_id and BUILDER role
  const accessToken = signAccessToken({
    sub: updated.id,
    email: updated.email,
    role: updated.role as any,
    company_id: updated.company_id,
  });

  return ok({
    user: {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      company_id: updated.company_id,
      onboarded: updated.onboarded
    },
    accessToken,
    company,
    membership 
  }, "Company created successfully");
});
