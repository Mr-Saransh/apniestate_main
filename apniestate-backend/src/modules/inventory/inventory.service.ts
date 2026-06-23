import { prisma } from "@/lib/prisma";

export async function getInventoryItems(userId: string, role?: string) {
  const where: any = {};
  if (role === "SITE_SUPERVISOR") {
    where.site = { supervisor_id: userId };
  }

  const items = await prisma.inventoryItem.findMany({
    where,
    include: {
      material: { select: { name: true, unit: true, category: true } },
      site: { select: { name: true } },
      transactions: true,
    },
    orderBy: { updated_at: "desc" }
  });

  return items.map(item => {
    const stockIn = item.transactions.filter(t => t.type === "IN").reduce((s, t) => s + t.quantity, 0);
    const stockOut = item.transactions.filter(t => t.type === "OUT").reduce((s, t) => s + t.quantity, 0);
    const adjust = item.transactions.filter(t => t.type === "ADJUST").reduce((s, t) => s + t.quantity, 0);
    const availableStock = stockIn - stockOut + adjust;

    // Average daily usage: total OUT in last 30 days divided by 30
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentOutTxns = item.transactions.filter(t => t.type === "OUT" && new Date(t.created_at) >= thirtyDaysAgo);
    const totalRecentOut = recentOutTxns.reduce((s, t) => s + t.quantity, 0);
    const avgDailyUsage = totalRecentOut > 0 ? (totalRecentOut / 30) : 0;
    
    const daysRemaining = avgDailyUsage > 0 ? Math.round(availableStock / avgDailyUsage) : 999;

    return {
      id: item.id,
      material_id: item.material_id,
      site_id: item.site_id,
      name: item.material?.name || "Unknown Material",
      category: item.material?.category || "Other",
      quantity: availableStock,
      unit: item.material?.unit || "pcs",
      minQuantity: item.min_quantity,
      site: { name: item.site?.name || "Unknown Site" },
      stock_in: stockIn,
      stock_out: stockOut,
      avg_daily_usage: avgDailyUsage,
      days_remaining: daysRemaining,
      is_low_stock: availableStock <= item.min_quantity
    };
  });
}

export async function getInventoryById(id: string) {
  const item = await prisma.inventoryItem.findUnique({
    where: { id },
    include: {
      material: { select: { name: true, unit: true } },
      site: { select: { name: true } },
      transactions: true
    }
  });
  if (!item) return null;

  const stockIn = item.transactions.filter(t => t.type === "IN").reduce((s, t) => s + t.quantity, 0);
  const stockOut = item.transactions.filter(t => t.type === "OUT").reduce((s, t) => s + t.quantity, 0);
  const adjust = item.transactions.filter(t => t.type === "ADJUST").reduce((s, t) => s + t.quantity, 0);
  const availableStock = stockIn - stockOut + adjust;

  return {
    ...item,
    quantity: availableStock,
    name: item.material?.name,
    unit: item.material?.unit
  };
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

export async function createInventoryTransaction(data: any, userId: string) {
  return prisma.$transaction(async (tx) => {
    // 1. Find or create the InventoryItem
    let item = await tx.inventoryItem.findUnique({
      where: {
        material_id_site_id: {
          material_id: data.material_id,
          site_id: data.site_id,
        },
      },
    });

    if (!item) {
      item = await tx.inventoryItem.create({
        data: {
          material_id: data.material_id,
          site_id: data.site_id,
          quantity: 0,
          min_quantity: 5,
        },
      });
    }

    // 2. Calculate quantity change
    let quantityChange = data.quantity;
    if (data.type === "OUT") {
      quantityChange = -data.quantity;
    }

    // 3. Update InventoryItem quantity
    const updatedItem = await tx.inventoryItem.update({
      where: { id: item.id },
      data: {
        quantity: {
          increment: quantityChange,
        },
      },
    });

    // 4. Create transaction log
    const transaction = await tx.inventoryTransaction.create({
      data: {
        item_id: item.id,
        type: data.type,
        quantity: data.quantity,
        notes: data.notes || null,
        user_id: userId,
      },
    });

    return {
      transaction,
      item: updatedItem,
    };
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
