import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok, created } from "@/lib/response";
import { z } from "zod";
import { validateBody } from "@/middleware/validate.middleware";

const InventoryTransactionSchema = z.object({
  type: z.enum(["IN", "OUT", "ADJUST"]),
  quantity: z.number().positive("Quantity must be positive"),
  notes: z.string().optional().nullable(),
});

type Ctx = { params: Promise<{ id: string }> };

export const GET = withAuth(async (_req: NextRequest, _user, ctx?: Ctx) => {
  const { id } = await ctx!.params;
  const transactions = await prisma.inventoryTransaction.findMany({
    where: { item_id: id },
    include: {
      user: { select: { id: true, name: true } },
    },
    orderBy: { created_at: "desc" },
  });
  return ok(transactions);
});

export const POST = withAuth(async (req: NextRequest, user, ctx?: Ctx) => {
  const { id } = await ctx!.params;
  const parsed = await validateBody(req, InventoryTransactionSchema);
  if ("error" in parsed) return parsed.error;

  const { type, quantity, notes } = parsed.data;

  const result = await prisma.$transaction(async (tx) => {
    const transaction = await tx.inventoryTransaction.create({
      data: {
        item_id: id,
        type,
        quantity,
        notes,
        user_id: user.sub,
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    // Update inventory quantity
    const adjustment = type === "IN" ? quantity : type === "OUT" ? -quantity : 0;
    if (type === "ADJUST") {
      // ADJUST sets absolute quantity
      await tx.inventoryItem.update({
        where: { id },
        data: { quantity },
      });
    } else {
      await tx.inventoryItem.update({
        where: { id },
        data: { quantity: { increment: adjustment } },
      });
    }

    return transaction;
  });

  return created(result, `Stock ${type.toLowerCase()} recorded`);
});
