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
      const matRate = Number(item.material_rate) || 0;
      const labRate = Number(item.labour_rate) || 0;
      const eqRate = Number(item.equipment_rate) || 0;
      const othRate = Number(item.other_rate) || 0;
      const providedTotal = Number(item.total_rate) || 0;
      const qty = Number(item.quantity) || 0;
      
      const totalRate = providedTotal > 0 ? providedTotal : (matRate + labRate + eqRate + othRate);
      const totalAmount = totalRate * qty;
      totalEstimatedCost += totalAmount;

      return {
        code: item.code,
        description: item.description,
        quantity: qty,
        unit: item.unit,
        material_rate: matRate,
        labour_rate: labRate,
        equipment_rate: eqRate,
        other_rate: othRate,
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
