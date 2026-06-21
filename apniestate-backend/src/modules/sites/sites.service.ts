import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { CreateSiteSchema, UpdateSiteSchema } from "./sites.schema";

export async function getSites(userId: string) {
  return prisma.site.findMany({
    include: {
      project: { select: { name: true } },
      supervisor: { select: { name: true, role: true } }
    },
    orderBy: { created_at: "desc" }
  });
}

export async function getSiteById(id: string) {
  return prisma.site.findUnique({
    where: { id },
    include: {
      project: { select: { name: true } },
      supervisor: { select: { name: true, role: true } }
    }
  });
}

export async function createSite(data: any, userId: string) {
  return prisma.site.create({
    data,
    include: {
      project: { select: { name: true } },
      supervisor: { select: { name: true, role: true } }
    }
  });
}

export async function updateSite(id: string, data: any) {
  return prisma.site.update({
    where: { id },
    data,
    include: {
      project: { select: { name: true } },
      supervisor: { select: { name: true, role: true } }
    }
  });
}

export async function deleteSite(id: string) {
  return prisma.site.delete({ where: { id } });
}
