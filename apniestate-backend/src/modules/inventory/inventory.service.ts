import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { CreateInventorySchema, UpdateInventorySchema } from "./inventory.schema";

export async function getInventorys(userId: string) {
  return prisma.inventoryItem.findMany({
    include: {
      material: { select: { name: true, unit: true } },
      site: { select: { name: true } }
    },
    orderBy: { updated_at: "desc" }
  });
}

export async function getInventoryById(id: string) {
  return prisma.inventoryItem.findUnique({
    where: { id },
    include: {
      material: { select: { name: true, unit: true } },
      site: { select: { name: true } }
    }
  });
}

export async function createInventory(data: any, userId: string) {
  return prisma.inventoryItem.create({
    data,
    include: {
      material: { select: { name: true, unit: true } },
      site: { select: { name: true } }
    }
  });
}

export async function updateInventory(id: string, data: any) {
  return prisma.inventoryItem.update({
    where: { id },
    data,
    include: {
      material: { select: { name: true, unit: true } },
      site: { select: { name: true } }
    }
  });
}

export async function deleteInventory(id: string) {
  return prisma.inventoryItem.delete({ where: { id } });
}
