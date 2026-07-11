import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok, created, badRequest } from "@/lib/response";
import { createInventoryTransaction } from "@/modules/inventory/inventory.service";

export const GET = withAuth(async (req, user) => {
  const dbUser = await prisma.user.findUnique({ where: { id: user.sub } });
  if (!dbUser?.company_id) return badRequest("User company not found");

  const grns = await prisma.goodsReceiptNote.findMany({
    where: { site: { company_id: dbUser.company_id } },
    include: {
      items: {
        include: { material: { select: { id: true, name: true, unit: true } } }
      },
      purchase_order: { select: { po_number: true, vendor: { select: { name: true } } } },
      receiver: { select: { name: true } },
      site: { select: { name: true } },
    },
    orderBy: { created_at: "desc" },
  });
  return ok(grns);
});

export const POST = withAuth(async (req, user) => {
  const body = await req.json();
  const { po_id, site_id, remarks, items } = body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return badRequest("Items are required");
  }

  // Use a transaction for the entire GRN process
  const grnResult = await prisma.$transaction(async (tx) => {
    const grn = await tx.goodsReceiptNote.create({
      data: {
        po_id,
        site_id,
        received_by: user.sub,
        status: "VERIFIED",
        remarks,
        items: {
          create: items.map((i: any) => ({
            material_id: i.material_id,
            ordered_qty: Number(i.ordered_qty),
            received_qty: Number(i.received_qty),
            rejected_qty: Number(i.rejected_qty || 0),
            damaged_qty: Number(i.damaged_qty || 0),
            short_supply: Number(i.short_supply || 0)
          }))
        }
      },
      include: { items: true }
    });

    // We can't easily call createInventoryTransaction directly from inside this tx 
    // without passing the tx, so we'll do the ledger updates manually here or pass tx.
    // Let's do it manually for each item to stay in the same transaction.

    for (const item of grn.items) {
      if (item.received_qty > 0) {
        let invItem = await tx.inventoryItem.findUnique({
          where: { material_id_site_id: { material_id: item.material_id, site_id } }
        });

        if (!invItem) {
          invItem = await tx.inventoryItem.create({
            data: { material_id: item.material_id, site_id, quantity: 0, min_quantity: 5 }
          });
        }

        const quantityToAdd = item.received_qty;

        await tx.inventoryItem.update({
          where: { id: invItem.id },
          data: { quantity: { increment: quantityToAdd } }
        });

        await tx.inventoryTransaction.create({
          data: {
            item_id: invItem.id,
            type: "GRN_RECEIPT",
            quantity: quantityToAdd,
            notes: `GRN ${grn.id} against PO`,
            user_id: user.sub
          }
        });
      }
    }

    return grn;
  });

  return created(grnResult, "Goods Receipt Note created and inventory updated");
});
