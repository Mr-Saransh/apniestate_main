const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const p = await prisma.project.findFirst({
    select: { id: true, name: true, budget: true, actual_cost: true }
  });
  console.log("Project:", p);

  const po = await prisma.purchaseOrder.findMany({
    select: { id: true, total_amount: true, status: true }
  });
  console.log("Purchase Orders:", po);

  const grn = await prisma.goodsReceiptNote.findMany({
    select: { id: true, po_id: true, status: true },
    include: { items: true }
  });
  console.log("GRNs:", JSON.stringify(grn, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
