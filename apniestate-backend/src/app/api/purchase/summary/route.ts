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

    // BOQ / Quantity of Materials Items
    const boqs = await prisma.bOQ.findMany({
      where: { project_id: projectId },
      include: {
        categories: {
          orderBy: { created_at: 'asc' },
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

    // We need to find sites for this project
    const sites = await prisma.site.findMany({ where: { project_id: projectId }, select: { id: true } });
    const siteIds = sites.map(s => s.id);

    // Purchase Orders (Orders Tab)
    const orders = await prisma.purchaseOrder.findMany({
      where: { OR: [{ project_id: projectId }, { site_id: { in: siteIds } }] },
      include: { vendor: true, items: { include: { material: true } } },
      orderBy: { created_at: 'desc' },
    });

    // Calculate project-wide cumulative ordered and received quantities per material
    const materialOrderedMap = new Map<string, number>();
    const materialReceivedMap = new Map<string, number>();

    orders.forEach(o => {
      if (o.status === 'CANCELLED') return;
      o.items.forEach(i => {
        const matName = (i.material?.name || '').trim().toLowerCase();
        const matId = i.material_id;
        const qty = Number(i.quantity) || 0;
        const recQty = Number(i.received_quantity) || 0;

        if (matName) {
          materialOrderedMap.set(matName, (materialOrderedMap.get(matName) || 0) + qty);
          materialReceivedMap.set(matName, (materialReceivedMap.get(matName) || 0) + recQty);
        }
        if (matId) {
          materialOrderedMap.set(matId, (materialOrderedMap.get(matId) || 0) + qty);
          materialReceivedMap.set(matId, (materialReceivedMap.get(matId) || 0) + recQty);
        }
      });
    });

    const boqCategories = boqs.length > 0
      ? boqs[0].categories.map(c => ({
          id: c.id,
          name: c.name,
          items: c.items.map(i => {
            const matName = (i.material?.name || i.description || '').trim().toLowerCase();
            const ordQty = materialOrderedMap.get(matName) || (i.material_id ? materialOrderedMap.get(i.material_id) : 0) || 0;
            const recQty = materialReceivedMap.get(matName) || (i.material_id ? materialReceivedMap.get(i.material_id) : 0) || 0;
            const effectiveUsed = Math.max(Number(i.used_quantity) || 0, ordQty);
            const remaining = Math.max(0, (i.quantity || 0) - effectiveUsed);

            return {
              id: i.id,
              name: i.material?.name || i.description,
              unit: i.unit,
              planned: i.quantity,
              used: effectiveUsed,
              ordered: ordQty,
              received: recQty,
              remaining: remaining,
              rate: i.total_rate || i.material_rate || 0,
              amount: i.total_amount || ((i.quantity || 0) * (i.total_rate || i.material_rate || 0)),
              remarks: i.remarks || null,
              code: i.code || null,
              category: c.name
            };
          })
        }))
      : [];

    const boqItems = boqs.length > 0 
      ? boqs[0].categories.flatMap(c => 
          c.items.map(i => {
            const matName = (i.material?.name || i.description || '').trim().toLowerCase();
            const ordQty = materialOrderedMap.get(matName) || (i.material_id ? materialOrderedMap.get(i.material_id) : 0) || 0;
            const recQty = materialReceivedMap.get(matName) || (i.material_id ? materialReceivedMap.get(i.material_id) : 0) || 0;
            const effectiveUsed = Math.max(Number(i.used_quantity) || 0, ordQty);
            const remaining = Math.max(0, (i.quantity || 0) - effectiveUsed);

            return {
              id: i.id,
              name: i.material?.name || i.description,
              unit: i.unit,
              planned: i.quantity,
              used: effectiveUsed,
              ordered: ordQty,
              received: recQty,
              remaining: remaining,
              rate: i.total_rate || i.material_rate || 0,
              amount: i.total_amount || ((i.quantity || 0) * (i.total_rate || i.material_rate || 0)),
              remarks: i.remarks || null,
              code: i.code || null,
              category: c.name
            };
          })
        )
      : [];

    console.log(`[API /purchase/summary] Found ${boqs.length} BOQs. boqItems:`, boqItems.length, 'categories:', boqCategories.length);

    // Material Requests
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
      quantity: r.quantity,
      unit: r.material.unit,
      date: new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      priority: r.priority,
      notes: r.notes
    }));

    const formattedOrders = orders.map(o => {
      let meta: any = null;
      if (o.notes) {
        try {
          if (o.notes.startsWith('{')) {
            meta = JSON.parse(o.notes);
          }
        } catch {}
      }

      let totalQuotedAmount = 0;
      let totalBoughtAmount = 0;

      const items = o.items.map(i => {
        const received = i.received_quantity || 0;
        const pending = Math.max(0, i.quantity - received);

        const varianceInfo = meta?.priceVariances?.find((v: any) =>
          v.materialName?.trim().toLowerCase() === i.material.name?.trim().toLowerCase()
        );
        const quotedPrice = varianceInfo?.quotedRate !== undefined ? Number(varianceInfo.quotedRate) : i.unit_price;
        const priceVariance = (i.unit_price - quotedPrice);

        totalQuotedAmount += (quotedPrice * i.quantity);
        totalBoughtAmount += (i.unit_price * i.quantity);

        return {
          id: i.id,
          materialId: i.material_id,
          materialName: i.material.name,
          unit: i.material.unit,
          orderedQty: i.quantity,
          receivedQty: received,
          pendingQty: pending,
          unitPrice: i.unit_price,
          quotedPrice: quotedPrice,
          priceVariance: priceVariance
        };
      });

      const pendingItems = items.filter(i => i.pendingQty > 0);
      const isDelivered = o.status === 'DELIVERED' || (items.length > 0 && pendingItems.length === 0);

      return {
        id: o.id,
        poNumber: o.po_number,
        name: o.items.length > 0 ? `${o.items[0].material.name} — ${o.items[0].quantity} ${o.items[0].material.unit}${o.items.length > 1 ? ` +${o.items.length - 1} more` : ''}` : o.po_number,
        vendor: o.vendor.name,
        amount: `₹${o.total_amount.toLocaleString()}`,
        numericAmount: o.total_amount,
        status: isDelivered ? 'DELIVERED' : o.status,
        date: new Date(o.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        eta: o.delivery_date ? new Date(o.delivery_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Pending',
        items,
        pendingItemsCount: pendingItems.length,
        quotationId: meta?.quotationId || null,
        totalQuotedAmount: totalQuotedAmount > 0 ? totalQuotedAmount : o.total_amount,
        totalNegotiatedSavings: totalQuotedAmount > 0 ? (totalQuotedAmount - totalBoughtAmount) : 0,
        notes: meta?.userNotes || o.notes || ''
      };
    });

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

    // Quotations with full vendor quote details
    const dbQuotations = await prisma.quotation.findMany({
      where: { rfq: { project_id: projectId } },
      include: { vendor: true, items: { include: { material: true } } },
      orderBy: { created_at: 'desc' }
    });
    const formattedQuotations = dbQuotations.map(q => {
      const firstItem = q.items[0];
      return {
        id: q.id,
        vendorId: q.vendor_id,
        vendor: q.vendor.name,
        vendorPhone: q.vendor.phone,
        material: firstItem ? firstItem.material.name : 'Multiple Items',
        rate: `₹${firstItem ? firstItem.rate.toLocaleString() : 0}`,
        numericRate: firstItem ? firstItem.rate : 0,
        quantity: firstItem ? firstItem.quantity : 0,
        unit: firstItem?.material?.unit || 'units',
        total: `₹${q.total_amount.toLocaleString()}`,
        numericTotal: q.total_amount,
        deliveryTime: q.delivery_time || '7 Days',
        status: q.status,
        date: new Date(q.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        items: q.items.map(it => ({
          materialId: it.material_id,
          materialName: it.material.name,
          quantity: it.quantity,
          rate: it.rate,
          unit: it.material.unit
        }))
      };
    });

    // Inventory
    const dbInventory = await prisma.inventoryItem.findMany({
      where: { site_id: { in: siteIds } },
      include: { material: true }
    });
    const formattedInventory = dbInventory.map(i => ({
      id: i.id,
      material: i.material.name,
      stock: `${i.quantity} ${i.material.unit}`,
      availableQuantity: i.quantity,
      unit: i.material.unit,
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
      boq_categories: boqCategories,
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
