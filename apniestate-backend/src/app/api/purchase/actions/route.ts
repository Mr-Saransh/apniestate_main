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
          data: { name: materialName, unit: payload.unit || 'pcs', company_id: user.company_id }
        });
      }

      const req = await prisma.materialRequest.create({
        data: {
          site_id: site.id,
          material_id: material.id,
          quantity: Number(quantity),
          status: 'PENDING_APPROVAL',
          requested_by: user.sub,
          notes: payload.varianceReason ? `[Cost Intelligence Variance: ${payload.varianceReason}] ${payload.notes || ''}`.trim() : (payload.notes || undefined)
        }
      });
      return NextResponse.json({ success: true, request: req });
    }

    if (action === 'UPDATE_REQUEST_STATUS') {
      const { requestId, status, approvedQuantity, notes } = payload;
      const dataToUpdate: any = { status };
      if (status === 'APPROVED') {
        dataToUpdate.approved_by = user.sub;
        if (approvedQuantity !== undefined) dataToUpdate.approved_quantity = Number(approvedQuantity);
      }
      if (notes) dataToUpdate.notes = notes;

      const req = await prisma.materialRequest.update({
        where: { id: requestId },
        data: dataToUpdate
      });
      return NextResponse.json({ success: true, request: req });
    }

    if (action === 'MODIFY_REQUEST') {
      const { requestId, quantity, approvedQuantity, status, notes } = payload;
      const dataToUpdate: any = {};
      if (quantity !== undefined) dataToUpdate.quantity = Number(quantity);
      if (approvedQuantity !== undefined) dataToUpdate.approved_quantity = Number(approvedQuantity);
      if (status) {
        dataToUpdate.status = status;
        if (status === 'APPROVED') dataToUpdate.approved_by = user.sub;
      }
      if (notes !== undefined) dataToUpdate.notes = notes;

      const req = await prisma.materialRequest.update({
        where: { id: requestId },
        data: dataToUpdate
      });
      return NextResponse.json({ success: true, request: req });
    }

    if (action === 'CREATE_BOQ_ITEM') {
      const { projectId, items, categoryName = 'General' } = payload;
      let boq = await prisma.bOQ.findFirst({ 
        where: { project_id: projectId },
        orderBy: { version: 'desc' }
      });
      if (!boq) {
        boq = await prisma.bOQ.create({ data: { project_id: projectId, created_by: user.sub } });
      }
      
      const boqItemsData = [];
      for (const item of items) {
        const parsedRate = Number(item.rate) || 0;
        const parsedQty = Number(item.planned) || 0;
        if (parsedQty < 0 || !item.name) continue;
        const catName = item.category || categoryName || 'General';
        
        let category = await prisma.bOQCategory.findFirst({
          where: { boq_id: boq.id, name: catName }
        });
        if (!category) {
          category = await prisma.bOQCategory.create({
            data: { boq_id: boq.id, name: catName }
          });
        }

        boqItemsData.push({
          category_id: category.id,
          description: item.name,
          unit: item.unit || 'nos',
          quantity: parsedQty,
          material_rate: parsedRate,
          total_rate: parsedRate,
          total_amount: (item.amount !== undefined && item.amount !== null && !isNaN(Number(item.amount))) 
            ? Number(item.amount) 
            : parsedRate * parsedQty,
          remarks: item.remarks || null,
          code: item.code || null
        });
      }
      
      if (boqItemsData.length > 0) {
        for (const itm of boqItemsData) {
          await prisma.bOQItem.create({ data: itm });
        }
      }
      return NextResponse.json({ success: true, count: boqItemsData.length });
    }

    if (action === 'SAVE_BOQ_TABLES') {
      const { projectId, categories, replaceAll = false } = payload;
      let boq = await prisma.bOQ.findFirst({ 
        where: { project_id: projectId },
        orderBy: { version: 'desc' }
      });
      if (!boq) {
        boq = await prisma.bOQ.create({ data: { project_id: projectId, created_by: user.sub } });
      }

      if (replaceAll) {
        // Remove existing categories and items for clean overwrite
        await prisma.bOQCategory.deleteMany({
          where: { boq_id: boq.id }
        });
      }

      let totalCost = 0;
      let totalCreated = 0;

      for (const cat of categories) {
        if (!cat.name) continue;
        let category = await prisma.bOQCategory.findFirst({
          where: { boq_id: boq.id, name: cat.name }
        });
        if (!category) {
          category = await prisma.bOQCategory.create({
            data: { boq_id: boq.id, name: cat.name }
          });
        }

        for (const item of (cat.items || [])) {
          const parsedRate = Number(item.rate) || 0;
          const parsedQty = Number(item.planned || item.quantity) || 0;
          if (!item.name && parsedQty <= 0) continue;

          const itemTotal = (item.amount !== undefined && item.amount !== null && !isNaN(Number(item.amount)))
            ? Number(item.amount)
            : parsedRate * parsedQty;

          totalCost += itemTotal;

          await prisma.bOQItem.create({
            data: {
              category_id: category.id,
              description: item.name || 'Unnamed Material',
              unit: item.unit || 'nos',
              quantity: parsedQty,
              material_rate: parsedRate,
              total_rate: parsedRate,
              total_amount: itemTotal,
              remarks: item.remarks || null,
              code: item.code || null
            }
          });
          totalCreated++;
        }
      }

      // Update total estimated cost on BOQ
      await prisma.bOQ.update({
        where: { id: boq.id },
        data: { total_estimated_cost: totalCost }
      });

      return NextResponse.json({ success: true, count: totalCreated, totalCost });
    }

    if (action === 'UPDATE_BOQ_ITEM') {
      const { itemId, name, planned, unit, rate, amount, remarks, code } = payload;
      const parsedRate = Number(rate) || 0;
      const parsedQty = Number(planned) || 0;
      const parsedAmount = (amount !== undefined && amount !== null && !isNaN(Number(amount)))
        ? Number(amount)
        : parsedRate * parsedQty;

      const updated = await prisma.bOQItem.update({
        where: { id: itemId },
        data: {
          description: name !== undefined ? name : undefined,
          quantity: planned !== undefined ? parsedQty : undefined,
          unit: unit !== undefined ? unit : undefined,
          material_rate: rate !== undefined ? parsedRate : undefined,
          total_rate: rate !== undefined ? parsedRate : undefined,
          total_amount: amount !== undefined || (rate !== undefined && planned !== undefined) ? parsedAmount : undefined,
          remarks: remarks !== undefined ? remarks : undefined,
          code: code !== undefined ? code : undefined
        }
      });
      return NextResponse.json({ success: true, item: updated });
    }

    if (action === 'DELETE_BOQ_ITEM') {
      const { itemId } = payload;
      await prisma.bOQItem.delete({
        where: { id: itemId }
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'CREATE_BOQ_CATEGORY') {
      const { projectId, name } = payload;
      if (!name || !name.trim()) {
        return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
      }
      let boq = await prisma.bOQ.findFirst({ 
        where: { project_id: projectId },
        orderBy: { version: 'desc' }
      });
      if (!boq) {
        boq = await prisma.bOQ.create({ data: { project_id: projectId, created_by: user.sub } });
      }
      const trimmedName = name.trim();
      const existing = await prisma.bOQCategory.findFirst({
        where: { boq_id: boq.id, name: trimmedName }
      });
      if (existing) {
        return NextResponse.json({ success: true, category: existing });
      }
      const category = await prisma.bOQCategory.create({
        data: {
          boq_id: boq.id,
          name: trimmedName
        }
      });
      return NextResponse.json({ success: true, category });
    }

    if (action === 'UPDATE_BOQ_CATEGORY') {
      const { categoryId, name } = payload;
      if (!name || !name.trim()) {
        return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
      }
      const category = await prisma.bOQCategory.update({
        where: { id: categoryId },
        data: { name: name.trim() }
      });
      return NextResponse.json({ success: true, category });
    }

    if (action === 'DELETE_BOQ_CATEGORY') {
      const { categoryId, name, projectId } = payload;
      if (categoryId) {
        const cat = await prisma.bOQCategory.findUnique({ where: { id: categoryId } });
        if (cat) {
          await prisma.bOQCategory.delete({
            where: { id: categoryId }
          });
          return NextResponse.json({ success: true });
        }
      }
      if (name && projectId) {
        const boq = await prisma.bOQ.findFirst({ where: { project_id: projectId }, orderBy: { version: 'desc' } });
        if (boq) {
          await prisma.bOQCategory.deleteMany({
            where: { boq_id: boq.id, name }
          });
        }
      }
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
      const { projectId, vendorId, eta, items, requestId, quotationId, notes } = payload;
      let site = await prisma.site.findFirst({ where: { project_id: projectId } });
      if (!site) {
        site = await prisma.site.create({
          data: { project_id: projectId, company_id: user.company_id, name: "Main Site", location: "Main Location", status: "IN_PROGRESS" }
        });
      }
      
      let totalAmount = 0;
      const poItemsData = [];
      const priceVariances = [];

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
        const quotedRate = Number(item.quotedRate) !== undefined && !isNaN(Number(item.quotedRate)) ? Number(item.quotedRate) : parsedRate;
        const total = parsedQty * parsedRate;
        totalAmount += total;

        poItemsData.push({
          material_id: material.id,
          quantity: parsedQty,
          unit_price: parsedRate,
          total: total
        });

        priceVariances.push({
          materialName: item.materialName,
          materialId: material.id,
          quotedRate: quotedRate,
          boughtRate: parsedRate,
          quantity: parsedQty,
          varianceAmount: (parsedRate - quotedRate) * parsedQty
        });
      }

      if (poItemsData.length === 0) {
        return NextResponse.json({ error: 'No valid items provided' }, { status: 400 });
      }

      const poNumber = `PO-${Math.floor(Math.random() * 100000)}`;

      // Serialized metadata to store quotation and price variance tracking
      const poMeta = JSON.stringify({
        userNotes: notes || '',
        quotationId: quotationId || null,
        requestId: requestId || null,
        priceVariances
      });

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
          notes: poMeta,
          items: {
            create: poItemsData
          }
        }
      });

      // 1. Update QoM (Quantity of Materials) used_quantity baseline for each ordered item
      try {
        for (const item of items) {
          if (!item.materialName) continue;
          const parsedQty = Number(item.quantity) || 0;
          if (parsedQty <= 0) continue;

          const boqItems = await prisma.bOQItem.findMany({
            where: {
              OR: [
                { description: { equals: item.materialName.trim(), mode: 'insensitive' } },
                { code: item.materialName.trim() }
              ],
              category: { boq: { project_id: projectId } }
            }
          });

          if (boqItems.length > 0) {
            await prisma.bOQItem.update({
              where: { id: boqItems[0].id },
              data: { used_quantity: { increment: parsedQty } }
            });
          }
        }
      } catch (boqErr) {
        console.error("Auto BOQ used_quantity increment error:", boqErr);
      }

      // 2. Lock Material Requirement (Indent) so it cannot be ordered again
      try {
        if (requestId) {
          await prisma.materialRequest.update({
            where: { id: requestId },
            data: {
              status: 'ORDERED',
              notes: `Order placed via PO ${poNumber}`
            }
          });
        } else {
          // If no explicit requestId was passed, check if there are approved requirements for these materials in this project
          for (const item of items) {
            if (!item.materialName) continue;
            const matchingReq = await prisma.materialRequest.findFirst({
              where: {
                site_id: site.id,
                status: 'APPROVED',
                material: { name: { equals: item.materialName.trim(), mode: 'insensitive' } }
              }
            });
            if (matchingReq) {
              await prisma.materialRequest.update({
                where: { id: matchingReq.id },
                data: {
                  status: 'ORDERED',
                  notes: `Auto-linked and locked via PO ${poNumber}`
                }
              });
            }
          }
        }
      } catch (reqErr) {
        console.error("Auto requirement status update error:", reqErr);
      }

      // 3. If ordered from a Quotation, mark that Quotation as ACCEPTED
      try {
        if (quotationId) {
          await prisma.quotation.update({
            where: { id: quotationId },
            data: { status: 'ACCEPTED' }
          });
        }
      } catch (qErr) {
        console.error("Auto quotation accept error:", qErr);
      }

      // Automatically add as Due in Finance
      try {
        const vendor = await prisma.vendor.findUnique({ where: { id: vendorId }, select: { name: true, phone: true } });
        const itemsSummary = items.map((i: any) => i.materialName).filter(Boolean).join(', ');
        await prisma.financeDue.create({
          data: {
            company_id: user.company_id,
            project_id: projectId,
            vendor_id: vendorId,
            purchase_order_id: po.id,
            title: `PO ${poNumber} - ${itemsSummary.slice(0, 70) || 'Materials Order'}`,
            party_name: vendor?.name || "Vendor",
            party_phone: vendor?.phone || null,
            party_type: "VENDOR",
            due_type: "VENDOR_PURCHASE",
            total_amount: totalAmount,
            paid_amount: 0,
            remaining_amount: totalAmount,
            due_date: eta ? new Date(eta) : null,
            status: "UNPAID",
            notes: `Auto-generated from Procurement order ${poNumber}`,
            created_by: user.sub,
          }
        });
      } catch (dueErr) {
        console.error("Auto FinanceDue generation error:", dueErr);
      }

      return NextResponse.json({ success: true, po });
    }

    if (action === 'UPDATE_PO_STATUS') {
      const { poId, status } = payload;
      const existingPo = await prisma.purchaseOrder.findUnique({ where: { id: poId } });
      if (!existingPo) return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 });

      // Enforce immutability: approved orders cannot be arbitrarily edited
      if (['APPROVED', 'DELIVERED', 'PARTIAL'].includes(existingPo.status) && status === 'DRAFT') {
        return NextResponse.json({
          error: `Purchase order ${existingPo.po_number} is already APPROVED and locked against modification.`
        }, { status: 400 });
      }

      const updated = await prisma.purchaseOrder.update({
        where: { id: poId },
        data: { status }
      });
      return NextResponse.json({ success: true, po: updated });
    }

    if (action === 'RECEIVE_GOODS') {
      const { projectId, poId, quality, items, billUrl } = payload;
      const po = await prisma.purchaseOrder.findUnique({ 
        where: { id: poId },
        include: { items: { include: { material: true } } }
      });
      if (!po) return NextResponse.json({ error: 'Purchase Order not found' }, { status: 400 });
      let siteId = po.site_id;
      if (!siteId) {
        const site = await prisma.site.findFirst({ where: { project_id: po.project_id || projectId } });
        if (site) {
          siteId = site.id;
        } else {
          const newSite = await prisma.site.create({
            data: {
              project_id: po.project_id || projectId,
              company_id: user.company_id,
              name: "Main Site",
              location: "Main Location",
              status: "IN_PROGRESS"
            }
          });
          siteId = newSite.id;
        }
      }

      const result = await prisma.$transaction(async (tx) => {
        const grnItemsData = [];
        for (const item of (items || [])) {
          const parsedQty = Number(item.receivedQty) || 0;
          if (parsedQty <= 0) continue;
          
          const searchVal = String(item.poItemId || item.id || "").trim().toLowerCase();
          const matSearch = String(item.materialName || "").trim().toLowerCase();
          
          let poItem = po.items.find(i => 
            i.id === item.poItemId || 
            i.material_id === item.materialId ||
            (searchVal && (i.id.toLowerCase() === searchVal || i.material_id.toLowerCase() === searchVal)) ||
            (matSearch && i.material?.name.toLowerCase() === matSearch) ||
            (searchVal && i.material?.name.toLowerCase() === searchVal)
          );

          if (!poItem && po.items.length === 1 && !matSearch) {
            poItem = po.items[0];
          }
          
          if (!poItem) {
            const rawName = item.materialName || item.poItemId;
            if (rawName) {
              let material = await tx.material.findFirst({
                where: {
                  company_id: user.company_id,
                  name: { equals: rawName, mode: 'insensitive' }
                }
              });
              if (!material) {
                material = await tx.material.create({
                  data: {
                    name: rawName,
                    unit: item.unit || 'units',
                    company_id: user.company_id
                  }
                });
              }
              if (material) {
                grnItemsData.push({
                  material_id: material.id,
                  ordered_qty: parsedQty,
                  received_qty: parsedQty
                });
              }
            }
            continue;
          }

          grnItemsData.push({
            material_id: poItem.material_id,
            ordered_qty: poItem.quantity,
            received_qty: parsedQty
          });
        }
        
        if (grnItemsData.length === 0) throw new Error("No valid items to receive or received quantity is 0");

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

        // Check if all items in the PO have been fully received
        const updatedPoItems = await tx.purchaseOrderItem.findMany({
          where: { purchase_order_id: poId }
        });
        const allReceived = updatedPoItems.length > 0 && updatedPoItems.every(pi => (pi.received_quantity || 0) >= pi.quantity);
        await tx.purchaseOrder.update({
          where: { id: poId },
          data: { status: allReceived ? 'DELIVERED' : 'PARTIAL' }
        });

        return newGrn;
      });

      return NextResponse.json({ success: true, grn: result });
    }

    if (action === 'CONSUME_MATERIAL') {
      const { projectId, items } = payload;
      const sites = await prisma.site.findMany({ where: { project_id: projectId }, select: { id: true } });
      let siteIds = sites.map(s => s.id);
      
      let defaultSite = sites.length > 0 ? sites[0] : null;
      if (!defaultSite) {
        defaultSite = await prisma.site.create({
          data: { project_id: projectId, company_id: user.company_id, name: "Main Site", location: "Main Location", status: "IN_PROGRESS" }
        });
        siteIds = [defaultSite.id];
      }
      
      const validItems = (items || []).filter((i: any) => Number(i.quantity) > 0);
      if (validItems.length === 0) {
        return NextResponse.json({ error: 'Please specify at least one material with quantity > 0 to consume' }, { status: 400 });
      }

      // Pre-check stock levels to provide clear, actionable feedback
      for (const item of validItems) {
        const parsedQty = Number(item.quantity) || 0;
        
        let invItem = null;
        if (item.inventoryItemId) {
          invItem = await prisma.inventoryItem.findFirst({
            where: { id: item.inventoryItemId, site_id: { in: siteIds } },
            include: { material: true }
          });
        }
        
        if (!invItem && item.materialName) {
          // Find inventory item for this project matching material name with available stock
          invItem = await prisma.inventoryItem.findFirst({
            where: {
              site_id: { in: siteIds },
              material: { name: { equals: item.materialName.trim(), mode: 'insensitive' } },
              quantity: { gt: 0 }
            },
            include: { material: true }
          });
          
          if (!invItem) {
            // Find any inventory item matching the name to check its stock
            invItem = await prisma.inventoryItem.findFirst({
              where: {
                site_id: { in: siteIds },
                material: { name: { equals: item.materialName.trim(), mode: 'insensitive' } }
              },
              include: { material: true }
            });
          }
        }

        const materialLabel = invItem?.material?.name || item.materialName || 'Material';

        if (!invItem) {
          return NextResponse.json({
            error: `Material "${materialLabel}" is not registered in site inventory (0 available).`
          }, { status: 400 });
        }

        const currentStock = invItem.quantity || 0;
        if (currentStock <= 0) {
          return NextResponse.json({
            error: `Cannot consume "${materialLabel}". It is currently out of stock (0 available).`
          }, { status: 400 });
        }
        if (currentStock < parsedQty) {
          return NextResponse.json({
            error: `Cannot consume ${parsedQty} of "${materialLabel}". Available stock is only ${currentStock}.`
          }, { status: 400 });
        }
      }

      const result = await prisma.$transaction(async (tx) => {
        const consumptions = [];
        for (const item of validItems) {
          const parsedQty = Number(item.quantity) || 0;
          
          let invItem = null;
          if (item.inventoryItemId) {
            invItem = await tx.inventoryItem.findFirst({
              where: { id: item.inventoryItemId, site_id: { in: siteIds } },
              include: { material: true }
            });
          }
          
          if (!invItem && item.materialName) {
            invItem = await tx.inventoryItem.findFirst({
              where: {
                site_id: { in: siteIds },
                material: { name: { equals: item.materialName.trim(), mode: 'insensitive' } },
                quantity: { gte: parsedQty }
              },
              include: { material: true }
            });
            if (!invItem) {
              invItem = await tx.inventoryItem.findFirst({
                where: {
                  site_id: { in: siteIds },
                  material: { name: { equals: item.materialName.trim(), mode: 'insensitive' } }
                },
                include: { material: true }
              });
            }
          }

          if (!invItem || (invItem.quantity || 0) < parsedQty) {
            const materialLabel = invItem?.material?.name || item.materialName || 'Material';
            throw new Error(`Insufficient stock for "${materialLabel}". Available: ${invItem ? invItem.quantity : 0}`);
          }

          // Decrement exact inventory item
          await tx.inventoryItem.update({
            where: { id: invItem.id },
            data: { quantity: { decrement: parsedQty } }
          });

          // Create inventory transaction
          await tx.inventoryTransaction.create({
            data: { item_id: invItem.id, type: 'MATERIAL_ISSUE', quantity: parsedQty, user_id: user.sub }
          });

          // Create consumption record
          const consumption = await tx.materialConsumption.create({
            data: { 
              site_id: invItem.site_id, 
              material_id: invItem.material_id, 
              quantity: parsedQty, 
              date: new Date() 
            }
          });
          consumptions.push(consumption);

          // Update BOQ item if matched
          const boqItems = await tx.bOQItem.findMany({
            where: { 
              OR: [
                { material_id: invItem.material_id },
                { description: { equals: invItem.material.name, mode: 'insensitive' } }
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
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 400 });
  }
});
