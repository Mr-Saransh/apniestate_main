import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/middleware/auth.middleware";
import { ok, badRequest } from "@/lib/response";

export const POST = withAuth(async (req: NextRequest, user) => {
  const body = await req.json();
  const { name, role = 'BUILDER' } = body;

  if (!name) {
    return badRequest("Company name is required");
  }

  // Create company
  const company = await prisma.company.create({
    data: { name }
  });

  // Assign user to this company with selected role
  const membership = await prisma.companyMembership.create({
    data: {
      user_id: user.sub,
      company_id: company.id,
      roles: [role]
    }
  });

  // Automatically switch them to the new workspace
  await prisma.user.update({
    where: { id: user.sub },
    data: { company_id: company.id, role }
  });

  return ok({ company, membership }, "Company created successfully");
});
