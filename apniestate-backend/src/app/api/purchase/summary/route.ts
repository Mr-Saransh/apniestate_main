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
        purchase_orders: true,
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
        gst: v.gst_number ? `GST: ${v.gst_number}` : 'No GST',
        orders: v.purchase_orders.length,
        due: `₹${Math.max(0, due).toLocaleString()}`,
      };
    });

    // Received (GRN)
    const grns = await prisma.goodsReceiptNote.findMany({
      where: { site_id: { in: siteIds } },
      include: {
        purchase_order: { include: { vendor: true, items: true } },
        items: { include: { material: true } }
      },
      orderBy: { created_at: 'desc' }
    });

    const attachments = await prisma.attachment.findMany({
      where: { entity_type: 'GRN', entity_id: { in: grns.map(g => g.id) }, category: 'Bill' }
    });

    const formattedGrns = grns.map(g => {
      const bill = attachments.find(a => a.entity_id === g.id);
      return {
        id: g.id,
        name: g.items.length > 0 ? `${g.items[0].material.name} — ${g.items[0].received_qty} ${g.items[0].material.unit}${g.items.length > 1 ? ` +${g.items.length - 1} more` : ''}` : 'Items',
        vendor: g.purchase_order.vendor.name,
        amount: `₹${g.purchase_order.total_amount.toLocaleString()}`, // Approximate for GRN
        received: new Date(g.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        quality: g.quality_status, // GOOD, REJECTED, PARTIAL
        billUrl: bill?.secure_url || null,
        fullItems: g.items.map(i => {
          const poItem = g.purchase_order.items.find(po => po.material_id === i.material_id);
          return {
            name: i.material.name,
            qty: i.received_qty,
            unit: i.material.unit,
            price: poItem?.unit_price || 0,
            total: (poItem?.unit_price || 0) * i.received_qty
          };
        })
      };
    });

    // Quotations
    const dbQuotations = await prisma.quotation.findMany({
      where: { rfq: { project_id: projectId } },
      include: { vendor: true, items: { include: { material: true } } },
      orderBy: { created_at: 'desc' }
    });
    const formattedQuotations = dbQuotations.map(q => ({
      id: q.id,
      vendor: q.vendor.name,
      material: q.items.length > 0 ? q.items[0].material.name : 'Multiple Items',
      rate: `₹${q.items.length > 0 ? q.items[0].rate.toLocaleString() : 0}`,
      total: `₹${q.total_amount.toLocaleString()}`,
      status: q.status
    }));

    // Inventory
    const dbInventory = await prisma.inventoryItem.findMany({
      where: { site_id: { in: siteIds } },
      include: { material: true }
    });
    const formattedInventory = dbInventory.map(i => ({
      id: i.id,
      material: i.material.name,
      stock: `${i.quantity} ${i.material.unit}`,
      reorderLevel: `${i.min_quantity || 0} ${i.material.unit}`
    }));

    // Consumption History
    const dbConsumption = await prisma.materialConsumption.findMany({
      where: { site_id: { in: siteIds } },
      include: { material: true },
      orderBy: { date: 'desc' }
    });
    const formattedConsumption = dbConsumption.map(c => ({
      id: c.id,
      material: c.material.name,
      qty: `${c.quantity} ${c.material.unit}`,
      date: new Date(c.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      time: new Date(c.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    }));

    return NextResponse.json({
      boq_items: boqItems,
      material_requests: formattedRequests,
      orders: formattedOrders,
      vendors: formattedVendors,
      received: formattedGrns,
      quotations: formattedQuotations,
      inventory: formattedInventory,
      consumption_logs: formattedConsumption,
    });
  } catch (error: any) {
    console.error('Purchase Summary API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
});
