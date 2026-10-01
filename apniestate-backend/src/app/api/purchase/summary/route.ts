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

    // Received (GRN)
    const grns = await prisma.goodsReceiptNote.findMany({
      where: { site_id: { in: siteIds } },
      include: {
        purchase_order: { include: { vendor: true, items: true } },
        items: { include: { material: true } }
      },
      orderBy: { created_at: 'desc' }
    });

    // Consumption History (Real DPR / Site Usage)
    const dbConsumption = await prisma.materialConsumption.findMany({
      where: { site_id: { in: siteIds } },
      include: { material: true },
      orderBy: { date: 'desc' }
    });

    // Centralized Calculation Maps (Points 3, 5, 6)
    const materialOrderedMap = new Map<string, number>();
    const materialWeightedRateMap = new Map<string, { totalCost: number; totalQty: number }>();
    const materialAcceptedMap = new Map<string, number>();
    const materialRejectedMap = new Map<string, number>();
    const materialConsumedMap = new Map<string, number>();

    // 1. Process active Purchase Orders
    orders.forEach(o => {
      if (['CANCELLED', 'REJECTED'].includes(o.status)) return;
      o.items.forEach(i => {
        const matName = (i.material?.name || '').trim().toLowerCase();
        const matId = i.material_id;
        const qty = Number(i.quantity) || 0;
        const unitPrice = Number(i.unit_price) || 0;

        if (matName) {
          materialOrderedMap.set(matName, (materialOrderedMap.get(matName) || 0) + qty);
          const existingRate = materialWeightedRateMap.get(matName) || { totalCost: 0, totalQty: 0 };
          materialWeightedRateMap.set(matName, {
            totalCost: existingRate.totalCost + (qty * unitPrice),
            totalQty: existingRate.totalQty + qty
          });
        }
        if (matId) {
          materialOrderedMap.set(matId, (materialOrderedMap.get(matId) || 0) + qty);
          const existingRate = materialWeightedRateMap.get(matId) || { totalCost: 0, totalQty: 0 };
          materialWeightedRateMap.set(matId, {
            totalCost: existingRate.totalCost + (qty * unitPrice),
            totalQty: existingRate.totalQty + qty
          });
        }
      });
    });

    // 2. Process GRNs (Accepted vs Rejected receipts)
    grns.forEach(g => {
      g.items.forEach(gi => {
        const matName = (gi.material?.name || '').trim().toLowerCase();
        const matId = gi.material_id;
        const parsedReceived = Number(gi.received_qty) || 0;
        let accepted = 0;
        let rejected = 0;

        if (g.quality_status === 'REJECTED') {
          accepted = 0;
          rejected = parsedReceived;
        } else if (g.quality_status === 'PARTIAL') {
          rejected = (Number(gi.rejected_qty) || 0) + (Number(gi.damaged_qty) || 0);
          accepted = Math.max(0, parsedReceived - rejected);
        } else {
          accepted = parsedReceived;
          rejected = 0;
        }

        if (matName) {
          materialAcceptedMap.set(matName, (materialAcceptedMap.get(matName) || 0) + accepted);
          materialRejectedMap.set(matName, (materialRejectedMap.get(matName) || 0) + rejected);
        }
        if (matId) {
          materialAcceptedMap.set(matId, (materialAcceptedMap.get(matId) || 0) + accepted);
          materialRejectedMap.set(matId, (materialRejectedMap.get(matId) || 0) + rejected);
        }
      });
    });

    // 3. Process site material consumptions
    dbConsumption.forEach(c => {
      const matName = (c.material?.name || '').trim().toLowerCase();
      const matId = c.material_id;
      const qty = Number(c.quantity) || 0;
      if (matName) {
        materialConsumedMap.set(matName, (materialConsumedMap.get(matName) || 0) + qty);
      }
      if (matId) {
        materialConsumedMap.set(matId, (materialConsumedMap.get(matId) || 0) + qty);
      }
    });

    const formatBOQItem = (i: any, categoryName: string) => {
      const matName = (i.material?.name || i.description || '').trim().toLowerCase();
      const plannedQty = Number(i.quantity) || 0;
      const plannedRate = Number(i.total_rate) || Number(i.material_rate) || 0;

      const ordQty = materialOrderedMap.get(matName) || (i.material_id ? materialOrderedMap.get(i.material_id) : 0) || 0;
      const accRecQty = materialAcceptedMap.get(matName) || (i.material_id ? materialAcceptedMap.get(i.material_id) : 0) || 0;
      const rejQty = materialRejectedMap.get(matName) || (i.material_id ? materialRejectedMap.get(i.material_id) : 0) || 0;
      const consumedLogQty = materialConsumedMap.get(matName) || (i.material_id ? materialConsumedMap.get(i.material_id) : 0) || 0;
      const realConsumed = Math.max(Number(i.used_quantity) || 0, consumedLogQty);

      // Remaining to Procure = max(planned - (ordered - rejected), 0)
      const remainingToProcure = Math.max(0, plannedQty - Math.max(0, ordQty - rejQty));
      // Remaining available for consumption = planned - consumed
      const remainingToConsume = Math.max(0, plannedQty - realConsumed);

      // Actual Purchase Rate (Weighted Average) vs Baseline Planned Rate (Point 5)
      const rateInfo = materialWeightedRateMap.get(matName) || (i.material_id ? materialWeightedRateMap.get(i.material_id) : null);
      let actualPurchaseRate = 0;
      let rateVariance = 0;
      let rateVariancePercent = 0;

      if (rateInfo && rateInfo.totalQty > 0) {
        actualPurchaseRate = Math.round((rateInfo.totalCost / rateInfo.totalQty) * 100) / 100;
        rateVariance = Math.round((actualPurchaseRate - plannedRate) * 100) / 100;
        rateVariancePercent = plannedRate > 0 ? Math.round(((actualPurchaseRate - plannedRate) / plannedRate) * 1000) / 10 : 0;
      }

      return {
        id: i.id,
        name: i.material?.name || i.description,
        unit: i.unit,
        planned: plannedQty,
        used: realConsumed,
        consumed: realConsumed,
        ordered: ordQty,
        received: accRecQty,
        acceptedReceived: accRecQty,
        rejected: rejQty,
        remaining: remainingToProcure,
        remainingToProcure,
        remainingToConsume,
        rate: plannedRate, // Baseline Planned / BOQ Rate (preserved!)
        actualPurchaseRate,
        rateVariance,
        rateVariancePercent,
        amount: i.total_amount || (plannedQty * plannedRate),
        remarks: i.remarks || null,
        code: i.code || null,
        category: categoryName
      };
    };

    const boqCategories = boqs.length > 0
      ? boqs[0].categories.map(c => ({
          id: c.id,
          name: c.name,
          items: c.items.map(i => formatBOQItem(i, c.name))
        }))
      : [];

    const boqItems = boqs.length > 0 
      ? boqs[0].categories.flatMap(c => c.items.map(i => formatBOQItem(i, c.name)))
      : [];

    console.log(`[API /purchase/summary] Found ${boqs.length} BOQs. boqItems:`, boqItems.length, 'categories:', boqCategories.length);

    // Material Requests (Point 8: Requested, Approved, Ordered)
    const requests = await prisma.materialRequest.findMany({
      where: { site_id: { in: siteIds } },
      include: { material: true },
      orderBy: { created_at: 'desc' },
    });

    const formattedRequests = requests.map(r => {
      const requestedQty = Number(r.quantity) || 0;
      const approvedQty = r.approved_quantity !== null && r.approved_quantity !== undefined ? Number(r.approved_quantity) : requestedQty;
      const orderedQty = r.ordered_quantity !== null && r.ordered_quantity !== undefined ? Number(r.ordered_quantity) : (r.status === 'ORDERED' ? approvedQty : 0);
      const isLocked = r.status === 'ORDERED' || r.status === 'COMPLETED';

      return {
        id: r.id,
        name: r.material.name,
        stage: r.status, // "DRAFT", "PENDING_APPROVAL", "QUOTATION", "ORDERED", "APPROVED"
        qty: `${requestedQty} ${r.material.unit}`,
        quantity: requestedQty, // Historical site requested quantity (immutable)
        requestedQuantity: requestedQty,
        approvedQuantity: approvedQty,
        orderedQuantity: orderedQty,
        isLocked,
        unit: r.material.unit,
        date: new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        priority: r.priority,
        notes: r.notes
      };
    });

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



    const attachments = await prisma.attachment.findMany({
      where: { entity_type: 'GRN', entity_id: { in: grns.map(g => g.id) }, category: 'Bill' }
    });

    const formattedGrns = grns.map(g => {
      const bill = attachments.find(a => a.entity_id === g.id);

      let deliveryTime = '';
      let deliverySpeed = 'ON_TIME';
      if (g.date) {
        deliveryTime = new Date(g.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
      }
      if (g.remarks) {
        const timeMatch = g.remarks.match(/\[Time:\s*([^\]]+)\]/i);
        if (timeMatch) deliveryTime = timeMatch[1].trim();

        const speedMatch = g.remarks.match(/\[Speed:\s*([^\]]+)\]/i);
        if (speedMatch) deliverySpeed = speedMatch[1].trim();
      }

      return {
        id: g.id,
        name: g.items.length > 0 ? `${g.items[0].material.name} — ${g.items[0].received_qty} ${g.items[0].material.unit}${g.items.length > 1 ? ` +${g.items.length - 1} more` : ''}` : 'Items',
        vendor: g.purchase_order.vendor.name,
        vendorId: g.purchase_order.vendor.id,
        amount: `₹${g.purchase_order.total_amount.toLocaleString()}`, // Approximate for GRN
        received: new Date(g.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        receivedTime: deliveryTime,
        deliverySpeed,
        remarks: g.remarks,
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
