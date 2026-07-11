import { prisma } from "@/lib/prisma";

export async function getSites(userId: string, role: string, companyId?: string | null, projectId?: string) {
  if (!companyId) return [];
  const where: any = { company_id: companyId };
  if (projectId) where.project_id = projectId;

  if (role === "BUILDER" || role === "ADMIN") {
    // see all
  } else {
    where.OR = [
      { supervisor_id: userId },
      { project: { builder_id: userId } },
      { project: { manager_id: userId } }
    ];
  }

  return prisma.site.findMany({
    where,
    include: {
      project: { select: { name: true } },
      supervisor: { select: { name: true, role: true } }
    },
    orderBy: { created_at: "desc" }
  });
}

export async function getSiteById(id: string, companyId?: string | null) {
  if (!companyId) return null;
  return prisma.site.findFirst({
    where: { id, company_id: companyId },
    include: {
      project: { select: { name: true } },
      supervisor: { select: { name: true, role: true } }
    }
  });
}

export async function createSite(data: any, userId: string, companyId?: string | null) {
  return prisma.site.create({
    data: {
      ...data,
      company_id: companyId || null
    },
    include: {
      project: { select: { name: true } },
      supervisor: { select: { name: true, role: true } }
    }
  });
}

export async function updateSite(id: string, data: any, companyId?: string | null) {
  if (!companyId) return null;
  const existing = await prisma.site.findFirst({ where: { id, company_id: companyId } });
  if (!existing) return null;

  return prisma.site.update({
    where: { id },
    data,
    include: {
      project: { select: { name: true } },
      supervisor: { select: { name: true, role: true } }
    }
  });
}

export async function deleteSite(id: string, companyId?: string | null) {
  if (!companyId) return null;
  const existing = await prisma.site.findFirst({ where: { id, company_id: companyId } });
  if (!existing) return null;
  return prisma.site.delete({ where: { id } });
}
