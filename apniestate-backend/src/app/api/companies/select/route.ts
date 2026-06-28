import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok, badRequest, notFound } from "@/lib/response";
import { signAccessToken } from "@/lib/jwt";

export const POST = withAuth(async (req: NextRequest, user) => {
  const body = await req.json().catch(() => ({}));

  if (!body.company_id || typeof body.company_id !== "string") {
    return badRequest("company_id is required");
  }

  // Verify the company exists
  const company = await prisma.company.findUnique({
    where: { id: body.company_id }
  });

  if (!company) {
    return notFound("Company");
  }

  // Update user's company_id
  const updated = await prisma.user.update({
    where: { id: user.sub },
    data: { company_id: body.company_id }
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
  }, "Company selected successfully");
});
