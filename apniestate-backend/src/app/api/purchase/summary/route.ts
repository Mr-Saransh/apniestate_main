import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/middleware/auth.middleware';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const GET = withAuth(async (request: Request, user: any) => {
  try {

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');

    if (!projectId) {
      return NextResponse.json({ error: 'project_id is required' }, { status: 400 });
    }
    
    console.log(`[API /purchase/summary] Fetching for projectId: ${projectId}`);

    // BOQ Items
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

    console.log(`[API /purchase/summary] Found ${boqs.length} BOQs. boqItems:`, boqItems);

    // Material Requests
    // We need to find sites for this project
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
      stage: r.status, // "DRAFT", "PENDING_APPROVAL", "QUOTATION", "ORDERED", "APPROVED"
      qty: `${r.quantity} ${r.material.unit}`,
      date: new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    }));

    // Purchase Orders (Orders Tab)
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

    // Vendors
    const vendors = await prisma.vendor.findMany({
      where: { company_id: user.company_id },
      include: {
        purchase_orders: { where: { status: 'DELIVERED' } },
        invoices: true,
        payments: true
      },
    });

    const formattedVendors = vendors.map(v => {
      const due = v.invoices.reduce((sum, i) => sum + i.total, 0) - v.payments.reduce((sum, p) => sum + p.amount, 0);
      return {
        id: v.id,
        name: v.name,
        category: v.category || 'General',
        rating: "4.5 ★",
        orders: v.purchase_orders.length,
        due: `₹${Math.max(0, due).toLocaleString()}`,
      };
    });

    // Received (GRN)
    const grns = await prisma.goodsReceiptNote.findMany({
      where: { site_id: { in: siteIds } },
      include: {
        purchase_order: { include: { vendor: true } },
        items: { include: { material: true } }
      },
      orderBy: { created_at: 'desc' }
    });

    const formattedGrns = grns.map(g => ({
      id: g.id,
      name: g.items.length > 0 ? `${g.items[0].material.name} — ${g.items[0].received_qty} ${g.items[0].material.unit}` : 'Items',
      vendor: g.purchase_order.vendor.name,
      amount: `₹${g.purchase_order.total_amount.toLocaleString()}`, // Approximate for GRN
      received: new Date(g.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      quality: g.quality_status, // GOOD, REJECTED, PARTIAL
    }));

    return NextResponse.json({
      boq_items: boqItems,
      material_requests: formattedRequests,
      orders: formattedOrders,
      vendors: formattedVendors,
      received: formattedGrns,
    });
  } catch (error: any) {
    console.error('Purchase Summary API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
});
