import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { CreateMaterialSchema, UpdateMaterialSchema } from "./materials.schema";

export async function getMaterials(userId: string) {
  return prisma.material.findMany({ orderBy: { name: "asc" } });
}

export async function getMaterialById(id: string) {
  return prisma.material.findUnique({ where: { id } });
}

export async function createMaterial(data: any, userId: string) {
  return prisma.material.create({ data });
}

export async function updateMaterial(id: string, data: any) {
  return prisma.material.update({ where: { id }, data });
}

export async function deleteMaterial(id: string) {
  return prisma.material.delete({ where: { id } });
}
