import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { CreateMaterialRequestSchema, UpdateMaterialRequestSchema } from "./schema";

export async function getMaterialRequests(filters?: { project_id?: string; site_id?: string; status?: string }) {
  const where: any = {};
  if (filters?.project_id) where.site = { project_id: filters.project_id };
  if (filters?.site_id) where.site_id = filters.site_id;
  if (filters?.status) where.status = filters.status;

  return prisma.materialRequest.findMany({
    where,
    include: {
      site: { select: { id: true, name: true, project_id: true } },
      material: { select: { id: true, name: true, unit: true } },
      requester: { select: { id: true, name: true } },
      approver: { select: { id: true, name: true } },
      vendor: { select: { id: true, name: true } },
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
      approver: { select: { id: true, name: true } },
      vendor: { select: { id: true, name: true } },
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
    throw new Error("Invalid site_id provided");
  }

  let materialId = data.material_id;
  const materialExists = await prisma.material.findUnique({ where: { id: materialId } });
  if (!materialExists) {
    throw new Error("Invalid material_id provided");
  }

  return prisma.materialRequest.create({
    data: {
      ...data,
      site_id: siteId,
      material_id: materialId,
      status: "SUBMITTED",
      priority: data.priority as any,
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
        status: data.status as any,
        approved_by: data.status === "APPROVED" ? userId : undefined,
        notes: data.notes,
        approved_quantity: data.approved_quantity,
        assigned_vendor_id: data.assigned_vendor_id,
        expected_delivery_date: data.expected_delivery_date ? new Date(data.expected_delivery_date) : undefined,
      },
      include: {
        site: { select: { id: true, name: true } },
        material: { select: { id: true, name: true, unit: true } },
      },
    });

    // NOTE: In Phase 6, DELIVERED inventory update is handled strictly by the Goods Receipt Note (GRN) module.
    // We no longer blindly update inventory when a Material Request is marked delivered.

    return request;
  }, {
    timeout: 15000
  });
}

export async function deleteMaterialRequest(id: string) {
  return prisma.materialRequest.delete({ where: { id } });
}
