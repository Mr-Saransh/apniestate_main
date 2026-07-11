import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok, created, badRequest } from "@/lib/response";

export const GET = withAuth(async (req, user) => {
  const issues = await prisma.materialIssue.findMany({
    include: {
      items: {
        include: { material: { select: { id: true, name: true, unit: true } } }
      },
      requester: { select: { name: true } },
      approver: { select: { name: true } },
      site: { select: { name: true } }
    },
    orderBy: { created_at: "desc" }
  });
  return ok(issues);
});

export const POST = withAuth(async (req, user) => {
  const body = await req.json();
  const { site_id, purpose, items } = body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return badRequest("Items are required");
  }

  const issueResult = await prisma.$transaction(async (tx) => {
    const issue = await tx.materialIssue.create({
      data: {
        site_id,
        requested_by: user.sub,
        purpose,
        status: "ISSUED", // Auto-approved for this phase, could be PENDING
        items: {
          create: items.map((i: any) => ({
            material_id: i.material_id,
            quantity: Number(i.quantity)
          }))
        }
      },
      include: { items: true }
    });

    for (const item of issue.items) {
      if (item.quantity > 0) {
        let invItem = await tx.inventoryItem.findUnique({
          where: { material_id_site_id: { material_id: item.material_id, site_id } }
        });

        if (!invItem || invItem.quantity < item.quantity) {
          throw new Error(`Insufficient stock for material ${item.material_id}`);
        }

        await tx.inventoryItem.update({
          where: { id: invItem.id },
          data: { quantity: { decrement: item.quantity } }
        });

        await tx.inventoryTransaction.create({
          data: {
            item_id: invItem.id,
            type: "MATERIAL_ISSUE",
            quantity: item.quantity,
            notes: `Issued for ${purpose || 'general use'}`,
            user_id: user.sub
          }
        });
      }
    }

    return issue;
  });

  return created(issueResult, "Material Issued and inventory updated");
});
