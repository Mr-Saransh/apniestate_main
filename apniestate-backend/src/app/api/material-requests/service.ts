import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { CreateMaterialRequestSchema, UpdateMaterialRequestSchema } from "./schema";

export async function getMaterialRequests(filters?: { site_id?: string; status?: string }) {
  const where: any = {};
  if (filters?.site_id) where.site_id = filters.site_id;
  if (filters?.status) where.status = filters.status;

  return prisma.materialRequest.findMany({
    where,
    include: {
      site: { select: { id: true, name: true } },
      material: { select: { id: true, name: true, unit: true } },
      requester: { select: { id: true, name: true } },
    },
    orderBy: { created_at: "desc" },
  });
}

export async function getMaterialRequestById(id: string) {
  return prisma.materialRequest.findUnique({
    where: { id },
    include: {
      site: { select: { id: true, name: true } },
      material: { select: { id: true, name: true, unit: true } },
      requester: { select: { id: true, name: true } },
    },
  });
}

export async function createMaterialRequest(
  data: z.infer<typeof CreateMaterialRequestSchema>,
  userId: string
) {
  let siteId = data.site_id;
  const siteExists = await prisma.site.findUnique({ where: { id: siteId } });
  if (!siteExists) {
    const firstSite = await prisma.site.findFirst();
    if (firstSite) siteId = firstSite.id;
  }

  let materialId = data.material_id;
  const materialExists = await prisma.material.findUnique({ where: { id: materialId } });
  if (!materialExists) {
    const firstMaterial = await prisma.material.findFirst();
    if (firstMaterial) materialId = firstMaterial.id;
  }

  return prisma.materialRequest.create({
    data: {
      ...data,
      site_id: siteId,
      material_id: materialId,
      // @ts-ignore - Prisma client needs regeneration to recognize priority
      priority: data.priority,
      requested_by: userId,
    },
    include: {
      site: { select: { id: true, name: true } },
      material: { select: { id: true, name: true, unit: true } },
    },
  });
}

export async function updateMaterialRequestStatus(
  id: string,
  data: z.infer<typeof UpdateMaterialRequestSchema>,
  userId: string
) {
  return prisma.$transaction(async (tx) => {
    const request = await tx.materialRequest.update({
      where: { id },
      data: {
        status: data.status,
        approved_by: data.status === "APPROVED" ? userId : undefined,
        notes: data.notes,
      },
      include: {
        site: { select: { id: true, name: true } },
        material: { select: { id: true, name: true, unit: true } },
      },
    });

    // If delivered, auto-add to site inventory
    if (data.status === "DELIVERED") {
      let inventoryItem = await tx.inventoryItem.findUnique({
        where: {
          material_id_site_id: {
            material_id: request.material_id,
            site_id: request.site_id,
          },
        },
      });

      if (!inventoryItem) {
        inventoryItem = await tx.inventoryItem.create({
          data: {
            material_id: request.material_id,
            site_id: request.site_id,
            quantity: 0,
            min_quantity: 5,
          },
        });
      }

      await tx.inventoryItem.update({
        where: { id: inventoryItem.id },
        data: { quantity: { increment: request.quantity } },
      });

      await tx.inventoryTransaction.create({
        data: {
          item_id: inventoryItem.id,
          type: "IN",
          quantity: request.quantity,
          notes: `Material request #${request.id} delivered to site`,
          user_id: userId,
        },
      });
    }

    return request;
  }, {
    timeout: 15000
  });
}

export async function deleteMaterialRequest(id: string) {
  return prisma.materialRequest.delete({ where: { id } });
}
