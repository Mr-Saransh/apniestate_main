import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/response";

// GET /api/inventory/alerts — items below minimum stock level
export const GET = withAuth(async (req: NextRequest, user) => {
  const dbUser = await prisma.user.findUnique({
    where: { id: user.sub }
  });

  const company_id = dbUser?.company_id || undefined;

  if (!company_id) {
    return ok([]);
  }

  // Fetch all and filter in memory to workaround Prisma not supporting column comparisons in where
  const allItems = await prisma.inventoryItem.findMany({
    where: {
      site: { company_id }
    },
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
