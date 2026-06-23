import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/response";

// GET /api/inventory/alerts — items below minimum stock level
export const GET = withAuth(async () => {
  const lowStockItems = await prisma.inventoryItem.findMany({
    where: {
      quantity: { lte: prisma.inventoryItem.fields.min_quantity as any },
    },
    include: {
      material: { select: { name: true, unit: true } },
      site: { select: { name: true } },
    },
    orderBy: { quantity: "asc" },
  });

  // Workaround: Prisma doesn't support comparing columns directly in where
  // So we fetch all and filter in memory
  const allItems = await prisma.inventoryItem.findMany({
    include: {
      material: { select: { name: true, unit: true } },
      site: { select: { name: true } },
    },
  });

  const alerts = allItems
    .filter(item => item.quantity <= item.min_quantity && item.min_quantity > 0)
    .map(item => ({
      id: item.id,
      material: item.material?.name,
      unit: item.material?.unit,
      site: item.site?.name,
      current_stock: item.quantity,
      min_required: item.min_quantity,
      deficit: item.min_quantity - item.quantity,
    }));

  return ok(alerts);
});
