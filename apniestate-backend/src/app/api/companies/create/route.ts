import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok, badRequest } from "@/lib/response";
import { signAccessToken } from "@/lib/jwt";

export const POST = withAuth(async (req: NextRequest, user) => {
  const body = await req.json().catch(() => ({}));

  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    return badRequest("Company name is required");
  }

  const companyName = body.name.trim();

  // Create the company
  const company = await prisma.company.create({
    data: { name: companyName }
  });

  // Assign user to the new company
  const updated = await prisma.user.update({
    where: { id: user.sub },
    data: { company_id: company.id }
  });

  // Re-sign JWT with new company_id
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
    company
  }, "Company created and assigned successfully");
});
