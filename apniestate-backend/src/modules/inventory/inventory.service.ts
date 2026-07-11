import { prisma } from "@/lib/prisma";
import { InventoryTransactionType } from "@prisma/client";

// Industry-standard default consumption rates for common construction materials
// Used when insufficient historical transaction data is available
const INDUSTRY_DEFAULTS: Record<string, { rate: number; unit: string }> = {
  'steel': { rate: 175, unit: 'kg' },       // 150-200 kg/day
  'cement': { rate: 35, unit: 'bags' },      // 30-40 bags/day
  'bricks': { rate: 600, unit: 'pcs' },      // 400-800 pcs/day
  'sand': { rate: 100, unit: 'cft' },        // 80-120 cft/day
  'aggregate': { rate: 50, unit: 'cubic meter' },
  'paint': { rate: 10, unit: 'litre' },
  'tiles': { rate: 80, unit: 'sqft' },
  'plywood': { rate: 20, unit: 'sqft' },
  'pipes': { rate: 30, unit: 'pcs' },
  'wiring': { rate: 50, unit: 'meter' },
  'rebar': { rate: 175, unit: 'kg' },
  'concrete': { rate: 5, unit: 'cubic meter' },
  'gravel': { rate: 80, unit: 'cft' },
};

function getDefaultRate(materialName: string): number | null {
  const nameLower = materialName.toLowerCase();
  for (const [key, config] of Object.entries(INDUSTRY_DEFAULTS)) {
    if (nameLower.includes(key)) {
      return config.rate;
    }
  }
  return null;
}

const STOCK_IN_TYPES = ["IN", "GRN_RECEIPT", "RETURN", "TRANSFER_IN"];
const STOCK_OUT_TYPES = ["OUT", "MATERIAL_ISSUE", "DAMAGE", "TRANSFER_OUT"];

export async function getInventoryItems(userId: string, role?: string, projectId?: string) {
  const where: any = {};

  // Project scoping — always filter by project if provided
  if (projectId) {
    where.site = { project_id: projectId };
  } else if (role === "BUILDER" || role === "ADMIN") {
    // see all across company (only on company dashboard)
  } else {
    where.OR = [
      { site: { supervisor_id: userId } },
      { site: { project: { builder_id: userId } } },
      { site: { project: { manager_id: userId } } }
    ];
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
    const stockIn = item.transactions.filter(t => STOCK_IN_TYPES.includes(t.type)).reduce((s, t) => s + t.quantity, 0);
    const stockOut = item.transactions.filter(t => STOCK_OUT_TYPES.includes(t.type)).reduce((s, t) => s + t.quantity, 0);
    const adjust = item.transactions.filter(t => t.type === "ADJUST").reduce((s, t) => s + t.quantity, 0);
    const availableStock = stockIn - stockOut + adjust;

    // Average daily usage: total OUT in last 30 days divided by 30
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentOutTxns = item.transactions.filter(t => STOCK_OUT_TYPES.includes(t.type) && new Date(t.created_at) >= thirtyDaysAgo);
    const totalRecentOut = recentOutTxns.reduce((s, t) => s + t.quantity, 0);
    
    // Check if we have sufficient historical data (>14 days of OUT transactions)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const hasSufficientHistory = item.transactions.filter(
      t => STOCK_OUT_TYPES.includes(t.type) && new Date(t.created_at) >= fourteenDaysAgo
    ).length >= 3; // At least 3 OUT transactions in 14 days
    
    let avgDailyUsage = 0;
    let isEstimated = false;
    
    if (hasSufficientHistory && totalRecentOut > 0) {
      // Use actual historical data
      avgDailyUsage = totalRecentOut / 30;
      isEstimated = false;
    } else {
      // Fall back to industry defaults
      const defaultRate = getDefaultRate(item.material?.name || "");
      if (defaultRate !== null) {
        avgDailyUsage = defaultRate;
        isEstimated = true;
      }
    }
    
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
      is_low_stock: availableStock <= item.min_quantity,
      is_estimated: isEstimated
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

  const stockIn = item.transactions.filter(t => STOCK_IN_TYPES.includes(t.type)).reduce((s, t) => s + t.quantity, 0);
  const stockOut = item.transactions.filter(t => STOCK_OUT_TYPES.includes(t.type)).reduce((s, t) => s + t.quantity, 0);
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

export async function createInventoryTransaction(data: { material_id: string, site_id: string, type: InventoryTransactionType, quantity: number, notes?: string | null }, userId: string) {
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
    if (STOCK_OUT_TYPES.includes(data.type)) {
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
  // Prevent direct quantity modification through standard update API
  if (data.quantity !== undefined) {
    throw new Error("Cannot modify quantity directly. Use transactions.");
  }
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
