import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/response";

export const GET = withAuth(async (req: NextRequest, user) => {
  // Gather all company IDs the user is associated with
  const companyIds = new Set<string>();

  // 1. User's direct company
  const dbUser = await prisma.user.findUnique({
    where: { id: user.sub },
    select: { company_id: true }
  });
  if (dbUser?.company_id) {
    companyIds.add(dbUser.company_id);
  }

  // 2. Companies from projects where user is builder or manager
  const projectCompanies = await prisma.project.findMany({
    where: {
      OR: [
        { builder_id: user.sub },
        { manager_id: user.sub }
      ],
      company_id: { not: null }
    },
    select: { company_id: true }
  });
  for (const p of projectCompanies) {
    if (p.company_id) companyIds.add(p.company_id);
  }

  // 3. Companies from sites where user is supervisor
  const siteCompanies = await prisma.site.findMany({
    where: {
      supervisor_id: user.sub,
      company_id: { not: null }
    },
    select: { company_id: true }
  });
  for (const s of siteCompanies) {
    if (s.company_id) companyIds.add(s.company_id);
  }

  if (companyIds.size === 0) {
    return ok([]);
  }

  const companies = await prisma.company.findMany({
    where: { id: { in: Array.from(companyIds) } },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      created_at: true,
      _count: {
        select: {
          users: true,
          projects: true
        }
      }
    }
  });

  return ok(companies);
});
