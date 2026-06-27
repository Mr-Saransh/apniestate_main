import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok, badRequest, notFound } from "@/lib/response";

export const GET = withAuth(async (req: NextRequest, user) => {
  const dbUser = await prisma.user.findUnique({
    where: { id: user.sub }
  });

  if (!dbUser || !dbUser.company_id) {
    return ok(null, "No company associated with this user yet.");
  }

  const company = await prisma.company.findUnique({
    where: { id: dbUser.company_id }
  });

  if (!company) {
    return notFound("Company not found");
  }

  return ok(company);
});

export const PATCH = withAuth(async (req: NextRequest, user) => {
  const body = await req.json().catch(() => ({}));

  if (!body.name || !body.name.trim()) {
    return badRequest("Company name is required");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.sub }
  });

  if (dbUser?.company_id) {
    const updatedCompany = await prisma.company.update({
      where: { id: dbUser.company_id },
      data: { name: body.name.trim() }
    });
    return ok(updatedCompany, "Company updated successfully");
  } else {
    const newCompany = await prisma.company.create({
      data: { name: body.name.trim() }
    });

    await prisma.user.update({
      where: { id: user.sub },
      data: { company_id: newCompany.id }
    });

    return ok(newCompany, "Company created and assigned successfully");
  }
});
