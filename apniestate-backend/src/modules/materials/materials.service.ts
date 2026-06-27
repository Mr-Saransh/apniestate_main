import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { CreateMaterialSchema, UpdateMaterialSchema } from "./materials.schema";

export async function getMaterials(userId: string, companyId?: string | null) {
  if (!companyId) return [];
  return prisma.material.findMany({ 
    where: { company_id: companyId },
    orderBy: { name: "asc" } 
  });
}

export async function getMaterialById(id: string, companyId?: string | null) {
  if (!companyId) return null;
  return prisma.material.findUnique({ where: { id, company_id: companyId } });
}

export async function createMaterial(data: any, userId: string, companyId?: string | null) {
  return prisma.material.create({ 
    data: {
      ...data,
      company_id: companyId || null
    }
  });
}

export async function updateMaterial(id: string, data: any, companyId?: string | null) {
  if (!companyId) return null;
  const existing = await prisma.material.findFirst({ where: { id, company_id: companyId } });
  if (!existing) return null;
  return prisma.material.update({ where: { id }, data });
}

export async function deleteMaterial(id: string, companyId?: string | null) {
  if (!companyId) return null;
  const existing = await prisma.material.findFirst({ where: { id, company_id: companyId } });
  if (!existing) return null;
  return prisma.material.delete({ where: { id } });
}
