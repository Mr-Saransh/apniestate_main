import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/middleware/auth.middleware';

export const POST = withAuth(async (request: Request, user: any) => {
  try {

    const body = await request.json();
    const { action, payload } = body;

    if (action === 'CREATE_REQUEST') {
      const { projectId, materialName, quantity, urgency } = payload;
      // Get the first site for the project (simplified)
      let site = await prisma.site.findFirst({ where: { project_id: projectId } });
      if (!site) {
        site = await prisma.site.create({
          data: {
            project_id: projectId,
            company_id: user.company_id,
            name: "Main Site",
            location: "Main Location",
            status: "IN_PROGRESS"
          }
        });
      }

      // Find or create material
      let material = await prisma.material.findFirst({ where: { name: materialName } });
      if (!material) {
        material = await prisma.material.create({
          data: { name: materialName, unit: 'pcs', company_id: user.company_id }
        });
      }

      const req = await prisma.materialRequest.create({
        data: {
          site_id: site.id,
          material_id: material.id,
          quantity: Number(quantity),
          status: 'PENDING_APPROVAL',
          requested_by: user.sub
        }
      });
      return NextResponse.json({ success: true, request: req });
    }

    if (action === 'UPDATE_REQUEST_STATUS') {
      const { requestId, status } = payload;
      const req = await prisma.materialRequest.update({
        where: { id: requestId },
        data: { status }
      });
      return NextResponse.json({ success: true, request: req });
    }

    if (action === 'CREATE_BOQ_ITEM') {
      const { projectId, items } = payload;
      // Find or create BOQ for project
      let boq = await prisma.bOQ.findFirst({ 
        where: { project_id: projectId },
        orderBy: { version: 'desc' }
      });
      if (!boq) {
        boq = await prisma.bOQ.create({ data: { project_id: projectId, created_by: user.sub } });
      }
      
      // Find or create category
      let category = await prisma.bOQCategory.findFirst({ where: { boq_id: boq.id } });
      if (!category) {
        category = await prisma.bOQCategory.create({ data: { boq_id: boq.id, name: 'General' } });
      }

      const boqItemsData = [];
      for (const item of items) {
        const parsedRate = Number(item.rate) || 0;
        const parsedQty = Number(item.planned) || 0;
        if (parsedQty <= 0) continue;
        boqItemsData.push({
          category_id: category.id,
          description: item.name,
          unit: item.unit || 'nos',
          quantity: parsedQty,
          material_rate: parsedRate,
          total_rate: parsedRate,
          total_amount: parsedRate * parsedQty
        });
      }
      
      if (boqItemsData.length > 0) {
        await prisma.bOQItem.createMany({
          data: boqItemsData
        });
      }
      return NextResponse.json({ success: true, count: boqItemsData.length });
    }

    if (action === 'DELETE_BOQ_ITEM') {
      const { itemId } = payload;
      await prisma.bOQItem.delete({
        where: { id: itemId }
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'CREATE_VENDOR') {
      const { name, category, phone } = payload;
      const vendor = await prisma.vendor.create({
        data: {
          company_id: user.company_id,
          name,
          category,
          phone
        }
      });
      return NextResponse.json({ success: true, vendor });
    }

    if (action === 'CREATE_QUOTATION') {
      const { projectId, vendorId, deliveryTime, items } = payload;
      let rfq = await prisma.rFQ.findFirst({ where: { project_id: projectId } });
      if (!rfq) {
        rfq = await prisma.rFQ.create({
          data: { project_id: projectId, company_id: user.company_id, status: 'PUBLISHED', created_by: user.sub }
        });
      }

      let totalAmount = 0;
      const quotationItemsData = [];
      for (const item of items) {
        if (!item.materialName) continue;
        let material = await prisma.material.findFirst({ where: { name: item.materialName } });
        if (!material) {
          material = await prisma.material.create({
            data: { name: item.materialName, unit: item.unit || 'pcs', company_id: user.company_id }
          });
        }
        const parsedQty = Number(item.quantity) || 1;
        const parsedRate = Number(item.rate) || 0;
        const total = parsedQty * parsedRate;
        totalAmount += total;
        quotationItemsData.push({
          material_id: material.id,
          quantity: parsedQty,
          rate: parsedRate,
          total: total
        });
      }

      if (quotationItemsData.length === 0) {
        return NextResponse.json({ error: 'No valid items provided' }, { status: 400 });
      }

      const quotation = await prisma.quotation.create({
        data: {
          rfq_id: rfq.id,
          vendor_id: vendorId,
          total_amount: totalAmount,
          delivery_time: deliveryTime || "7 Days",
          status: 'SUBMITTED',
          items: {
            create: quotationItemsData
          }
        }
      });
      return NextResponse.json({ success: true, quotation });
    }

    if (action === 'CREATE_PO') {
      const { projectId, vendorId, eta, items } = payload;
      let site = await prisma.site.findFirst({ where: { project_id: projectId } });
      if (!site) {
        site = await prisma.site.create({
          data: { project_id: projectId, company_id: user.company_id, name: "Main Site", location: "Main Location", status: "IN_PROGRESS" }
        });
      }
      
      let totalAmount = 0;
      const poItemsData = [];
      for (const item of items) {
        if (!item.materialName) continue;
        let material = await prisma.material.findFirst({ where: { name: item.materialName } });
        if (!material) {
          material = await prisma.material.create({
            data: { name: item.materialName, unit: item.unit || 'pcs', company_id: user.company_id }
          });
        }
        const parsedQty = Number(item.quantity) || 1;
        const parsedRate = Number(item.rate) || 0;
        const total = parsedQty * parsedRate;
        totalAmount += total;
        poItemsData.push({
          material_id: material.id,
          quantity: parsedQty,
          unit_price: parsedRate,
          total: total
        });
      }

      if (poItemsData.length === 0) {
        return NextResponse.json({ error: 'No valid items provided' }, { status: 400 });
      }

      const poNumber = `PO-${Math.floor(Math.random() * 100000)}`;
      const po = await prisma.purchaseOrder.create({
        data: {
          po_number: poNumber,
          vendor_id: vendorId,
          project_id: projectId,
          site_id: site.id,
          created_by: user.sub,
          status: 'APPROVED',
          total_amount: totalAmount,
          company_id: user.company_id,
          delivery_date: eta ? new Date(eta) : null,
          items: {
            create: poItemsData
          }
        }
      });
      return NextResponse.json({ success: true, po });
    }

    if (action === 'RECEIVE_GOODS') {
      const { projectId, poId, quality, items, billUrl } = payload;
      const po = await prisma.purchaseOrder.findUnique({ 
        where: { id: poId },
        include: { items: { include: { material: true } } }
      });
      if (!po) return NextResponse.json({ error: 'Purchase Order not found' }, { status: 400 });
      let siteId = po.site_id;
      if (!siteId) return NextResponse.json({ error: 'PO has no site' }, { status: 400 });

      const result = await prisma.$transaction(async (tx) => {
        const grnItemsData = [];
        for (const item of items) {
          const parsedQty = Number(item.receivedQty) || 0;
          if (parsedQty <= 0) continue;
          
          const searchVal = String(item.poItemId || "").toLowerCase();
          const poItem = po.items.find(i => 
            i.id === searchVal || 
            i.material_id === searchVal || 
            i.material?.name.toLowerCase() === searchVal
          );
          
          if (!poItem) continue;
          grnItemsData.push({
            material_id: poItem.material_id,
            ordered_qty: poItem.quantity,
            received_qty: parsedQty
          });
        }
        
        if (grnItemsData.length === 0) throw new Error("No valid items to receive");

        const newGrn = await tx.goodsReceiptNote.create({
          data: {
            po_id: poId,
            site_id: siteId,
            received_by: user.sub,
            quality_status: quality || "GOOD",
            items: {
              create: grnItemsData
            }
          }
        });
        
        if (billUrl) {
          await tx.attachment.create({
            data: {
              entity_type: "GRN",
              entity_id: newGrn.id,
              category: "Bill",
              file_name: "bill_upload",
              mime_type: "image/jpeg",
              secure_url: billUrl,
              uploaded_by: user.sub,
              company_id: user.company_id
            }
          });
        }

        for (const item of grnItemsData) {
          // Update PO received quantity
          await tx.purchaseOrderItem.updateMany({
            where: { purchase_order_id: poId, material_id: item.material_id },
            data: { received_quantity: { increment: item.received_qty } }
          });
          
          let invItem = await tx.inventoryItem.findFirst({
            where: { site_id: siteId, material_id: item.material_id }
          });
          if (invItem) {
            await tx.inventoryItem.update({
              where: { id: invItem.id },
              data: { quantity: { increment: item.received_qty } }
            });
          } else {
            invItem = await tx.inventoryItem.create({
              data: { site_id: siteId, material_id: item.material_id, quantity: item.received_qty, company_id: user.company_id }
            });
          }
          await tx.inventoryTransaction.create({
            data: { item_id: invItem.id, type: 'GRN_RECEIPT', quantity: item.received_qty, user_id: user.sub }
          });
        }
        return newGrn;
      });

      return NextResponse.json({ success: true, grn: result });
    }

    if (action === 'CONSUME_MATERIAL') {
      const { projectId, items } = payload;
      let site = await prisma.site.findFirst({ where: { project_id: projectId } });
      if (!site) {
        site = await prisma.site.create({
          data: { project_id: projectId, company_id: user.company_id, name: "Main Site", location: "Main Location", status: "IN_PROGRESS" }
        });
      }
      
      const result = await prisma.$transaction(async (tx) => {
        const consumptions = [];
        for (const item of items) {
          const parsedQty = Number(item.quantity) || 0;
          if (parsedQty <= 0) continue;
          
          let material = await tx.material.findFirst({ where: { name: item.materialName } });
          if (!material) {
            material = await tx.material.create({ data: { name: item.materialName, company_id: user.company_id, unit: item.unit || 'pcs' } });
          }
          
          let invItem = await tx.inventoryItem.findFirst({
            where: { site_id: site.id, material_id: material.id }
          });
          if (!invItem || invItem.quantity < parsedQty) throw new Error(`Insufficient inventory for ${item.materialName}`);

          await tx.inventoryItem.update({
            where: { id: invItem.id },
            data: { quantity: { decrement: parsedQty } }
          });

          await tx.inventoryTransaction.create({
            data: { item_id: invItem.id, type: 'MATERIAL_ISSUE', quantity: parsedQty, user_id: user.sub }
          });

          const consumption = await tx.materialConsumption.create({
            data: { site_id: site.id, material_id: material.id, quantity: parsedQty, date: new Date() }
          });
          consumptions.push(consumption);

          const boqItems = await tx.bOQItem.findMany({
            where: { 
              OR: [
                { material_id: material.id },
                { description: material.name }
              ],
              category: { boq: { project_id: projectId } }
            }
          });

          if (boqItems.length > 0) {
            await tx.bOQItem.update({
              where: { id: boqItems[0].id },
              data: { used_quantity: { increment: parsedQty } }
            });
          }
        }
        return consumptions;
      });
      return NextResponse.json({ success: true, consumptions: result });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('Purchase Actions API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
});
