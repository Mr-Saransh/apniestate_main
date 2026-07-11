import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { CreateBOQSchema, CreateBOQCategorySchema } from "./boq.schema";
import { BOQStatus } from "@prisma/client";

export async function getBOQForProject(project_id: string) {
  return await prisma.bOQ.findFirst({
    where: { project_id },
    orderBy: { version: 'desc' },
    include: {
      categories: {
        include: {
          items: true,
          children: {
            include: {
              items: true,
            }
          }
        }
      }
    }
  });
}

export async function createBOQ(data: z.infer<typeof CreateBOQSchema>, user_id: string) {
  let totalEstimatedCost = 0;

  // Pre-calculate totals for items if we want to save them cleanly
  const categoriesData = data.categories.map((cat: any) => {
    const itemsData = (cat.items || []).map((item: any) => {
      const totalRate = item.material_rate + item.labour_rate + item.equipment_rate + item.other_rate;
      const totalAmount = totalRate * item.quantity;
      totalEstimatedCost += totalAmount;

      return {
        code: item.code,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        material_rate: item.material_rate,
        labour_rate: item.labour_rate,
        equipment_rate: item.equipment_rate,
        other_rate: item.other_rate,
        total_rate: totalRate,
        total_amount: totalAmount,
        remarks: item.remarks,
      };
    });

    return {
      name: cat.name,
      items: {
        create: itemsData
      }
    };
  });

  const existingBOQ = await prisma.bOQ.findFirst({
    where: { project_id: data.project_id },
    orderBy: { version: 'desc' }
  });

  let newVersion = 1;
  if (existingBOQ) {
    if (existingBOQ.status === 'DRAFT') {
      // Overwrite existing draft
      await prisma.bOQ.delete({ where: { id: existingBOQ.id } });
      newVersion = existingBOQ.version;
    } else {
      // It's APPROVED or REVISED, create a new draft version
      newVersion = existingBOQ.version + 1;
    }
  }

  return await prisma.bOQ.create({
    data: {
      project_id: data.project_id,
      notes: data.notes,
      version: newVersion,
      created_by: user_id,
      status: BOQStatus.DRAFT,
      total_estimated_cost: totalEstimatedCost,
      categories: {
        create: categoriesData
      }
    },
    include: {
      categories: { include: { items: true } }
    }
  });
}

export async function approveBOQ(id: string, user_id: string) {
  return await prisma.bOQ.update({
    where: { id },
    data: {
      status: BOQStatus.APPROVED,
      approved_by: user_id
    }
  });
}
