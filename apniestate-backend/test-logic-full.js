const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const projectId = 'cmrhhwufa0007ugt8o49oy58p'; // hari nagar
  const user = { company_id: null }; // test user

  try {
    const boqs = await prisma.bOQ.findMany({
      where: { project_id: projectId },
      include: {
        categories: {
          include: {
            items: {
              include: { material: true }
            }
          }
        }
      },
      orderBy: { version: 'desc' },
      take: 1
    });

    const boqItems = boqs.length > 0 
      ? boqs[0].categories.flatMap(c => c.items).map(i => ({
          id: i.id,
          name: i.material?.name || i.description,
          unit: i.unit,
          planned: i.quantity,
          used: i.used_quantity,
        }))
      : [];

    const sites = await prisma.site.findMany({ where: { project_id: projectId }, select: { id: true } });
    const siteIds = sites.map(s => s.id);

    const requests = await prisma.materialRequest.findMany({
      where: { site_id: { in: siteIds } },
      include: { material: true },
      orderBy: { created_at: 'desc' },
    });

    const formattedRequests = requests.map(r => ({
      id: r.id,
      name: r.material.name,
      stage: r.status, 
      qty: `${r.quantity} ${r.material.unit}`,
      date: new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    }));

    const orders = await prisma.purchaseOrder.findMany({
      where: { OR: [{ project_id: projectId }, { site_id: { in: siteIds } }] },
      include: { vendor: true, items: { include: { material: true } } },
      orderBy: { created_at: 'desc' },
    });

    const formattedOrders = orders.map(o => ({
      id: o.id,
      name: o.items.length > 0 ? `${o.items[0].material.name} — ${o.items[0].quantity} ${o.items[0].material.unit}${o.items.length > 1 ? ` +${o.items.length - 1} more` : ''}` : o.po_number,
      vendor: o.vendor.name,
      amount: `₹${o.total_amount.toLocaleString()}`,
      status: o.status,
      date: new Date(o.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      eta: o.delivery_date ? new Date(o.delivery_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Pending',
    }));

    // Vendor query
    const vendors = await prisma.vendor.findMany({
      where: { company_id: user.company_id },
      include: {
        purchase_orders: { where: { status: 'DELIVERED' } },
        invoices: true,
        payments: true
      },
    });

    // Received query
    const grns = await prisma.goodsReceiptNote.findMany({
      where: { site_id: { in: siteIds } },
      include: {
        purchase_order: { include: { vendor: true } },
        items: { include: { material: true } }
      },
      orderBy: { created_at: 'desc' }
    });

    console.log("Success! BOQ Items:", boqItems.length);
  } catch(e) {
    console.error("FAILED!", e);
  }
}

check().catch(console.error).finally(() => prisma.$disconnect());
