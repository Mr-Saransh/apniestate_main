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
      const existingReq = await prisma.materialRequest.findUnique({ where: { id: requestId } });
      if (!existingReq) return NextResponse.json({ error: 'Request not found' }, { status: 404 });
      if (['ORDERED', 'COMPLETED'].includes(existingReq.status)) {
        return NextResponse.json({
          error: `Requirement has already been converted into an order (Status: ${existingReq.status}) and is locked against modifications.`
        }, { status: 400 });
      }

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
      const existingReq = await prisma.materialRequest.findUnique({ where: { id: requestId } });
      if (!existingReq) return NextResponse.json({ error: 'Request not found' }, { status: 404 });
      if (['ORDERED', 'COMPLETED'].includes(existingReq.status)) {
        return NextResponse.json({
          error: `Requirement has already been converted into an order (Status: ${existingReq.status}) and is locked against modifications.`
        }, { status: 400 });
      }

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
        if (parsedQty <= 0 || !item.name) continue;

        // Skip non-material noise rows (headers, totals, notes)
        const desc = String(item.name).trim().toLowerCase();
        if (/^(sub[\s-]?total|grand[\s-]?total|total[\s:]|net[\s-]?total|summary|total\b)/i.test(desc)) continue;
        if (/^(page\s+\d+|printed\s+on|date\s*:|tender\s+no)/i.test(desc)) continue;
        if (/^(note[s]?\s*:|important\s*:|general\s+notes?|specifications?\s*:|terms\s*(&|and)\s*conditions)/i.test(desc)) continue;
        if (/^([0-9]+(\.[0-9]+)*[.:)]?|[a-z]\.|\([a-z0-9]\)|[ivx]+\.|\s*[-*•#]\s*)$/i.test(desc) || /^\d+$/.test(desc)) continue;

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
          description: item.name.trim(),
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
          if (!item.name || parsedQty <= 0) continue;

          // Reject non-material summary/header rows
          const desc = String(item.name).trim().toLowerCase();
          if (/^(sub[\s-]?total|grand[\s-]?total|total[\s:]|net[\s-]?total|summary|total\b)/i.test(desc)) continue;
          if (/^(page\s+\d+|printed\s+on|date\s*:|tender\s+no)/i.test(desc)) continue;
          if (/^(note[s]?\s*:|important\s*:|general\s+notes?|specifications?\s*:|terms\s*(&|and)\s*conditions)/i.test(desc)) continue;
          if (/^([0-9]+(\.[0-9]+)*[.:)]?|[a-z]\.|\([a-z0-9]\)|[ivx]+\.|\s*[-*•#]\s*)$/i.test(desc) || /^\d+$/.test(desc)) continue;

          const itemTotal = (item.amount !== undefined && item.amount !== null && !isNaN(Number(item.amount)))
            ? Number(item.amount)
            : parsedRate * parsedQty;

          totalCost += itemTotal;

          await prisma.bOQItem.create({
            data: {
              category_id: category.id,
              description: item.name.trim() || 'Unnamed Material',
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

      // Check Quotation if provided to enforce finalPurchaseRate <= quotedRate (Point 7)
      let dbQuotation: any = null;
      if (quotationId) {
        dbQuotation = await prisma.quotation.findUnique({
          where: { id: quotationId },
          include: { items: { include: { material: true } } }
        });
      }

      for (const item of items) {
        if (!item.materialName) continue;
        const parsedRate = Number(item.rate) || 0;
        let quotedRate = Number(item.quotedRate);

        if (dbQuotation && dbQuotation.items) {
          const qItem = dbQuotation.items.find((qi: any) =>
            qi.material_id === item.materialId ||
            (qi.material?.name && qi.material.name.trim().toLowerCase() === String(item.materialName).trim().toLowerCase())
          );
          if (qItem && qItem.rate !== undefined) {
            quotedRate = qItem.rate;
          }
        }

        if (!isNaN(quotedRate) && quotedRate > 0 && parsedRate > quotedRate) {
          return NextResponse.json({
            error: `Final purchase rate (₹${parsedRate}) cannot exceed the selected quotation rate of ₹${quotedRate} for "${item.materialName}".`
          }, { status: 400 });
        }
      }

      const poResult = await prisma.$transaction(async (tx) => {
        let totalAmount = 0;
        const poItemsData = [];
        const priceVariances = [];

        for (const item of items) {
          if (!item.materialName) continue;
          let material = await tx.material.findFirst({
            where: { name: { equals: item.materialName.trim(), mode: 'insensitive' } }
          });
          if (!material) {
            material = await tx.material.create({
              data: { name: item.materialName.trim(), unit: item.unit || 'pcs', company_id: user.company_id }
            });
          }
          const parsedQty = Number(item.quantity) || 1;
          const parsedRate = Number(item.rate) || 0;
          const quotedRate = Number(item.quotedRate) !== undefined && !isNaN(Number(item.quotedRate)) ? Number(item.quotedRate) : parsedRate;
          const total = parsedQty * parsedRate;
          totalAmount += total;

          // ─── Cumulative Over-procurement Validation (Point 4) ───
          const boqItems = await tx.bOQItem.findMany({
            where: {
              category: { boq: { project_id: projectId } },
              OR: [
                { material_id: material.id },
                { description: { equals: item.materialName.trim(), mode: 'insensitive' } },
                { code: item.materialName.trim() }
              ]
            }
          });

          if (boqItems.length > 0) {
            const boqItem = boqItems[0];
            const plannedQty = Number(boqItem.quantity) || 0;

            // Sum active/non-cancelled ordered quantities
            const activePoItems = await tx.purchaseOrderItem.findMany({
              where: {
                purchase_order: {
                  project_id: projectId,
                  status: { notIn: ['CANCELLED', 'REJECTED'] }
                },
                OR: [
                  { material_id: material.id },
                  { material: { name: { equals: item.materialName.trim(), mode: 'insensitive' } } }
                ]
              }
            });
            const totalActiveOrdered = activePoItems.reduce((sum, pi) => sum + (Number(pi.quantity) || 0), 0);

            // Sum rejected quantities from GRNs to reopen unfulfilled procurement
            const grnItems = await tx.goodsReceiptNoteItem.findMany({
              where: {
                grn: {
                  purchase_order: {
                    project_id: projectId,
                    status: { notIn: ['CANCELLED'] }
                  }
                },
                material_id: material.id
              },
              include: { grn: true }
            });

            let totalRejected = 0;
            for (const gi of grnItems) {
              if (gi.grn.quality_status === 'REJECTED') {
                totalRejected += Number(gi.received_qty) || 0;
              } else {
                totalRejected += (Number(gi.rejected_qty) || 0) + (Number(gi.damaged_qty) || 0);
              }
            }

            const netCommitted = Math.max(0, totalActiveOrdered - totalRejected);
            const remainingToOrder = Math.max(0, plannedQty - netCommitted);

            if (parsedQty > remainingToOrder) {
              throw new Error(
                `Cannot order ${parsedQty} ${item.unit || 'units'} of "${item.materialName}". Planned quantity is ${plannedQty}, already active/ordered: ${netCommitted}. Remaining allowable quantity to order is ${remainingToOrder}.`
              );
            }
          }

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
          throw new Error('No valid items provided');
        }

        const poNumber = `PO-${Math.floor(Math.random() * 100000)}`;

        const poMeta = JSON.stringify({
          userNotes: notes || '',
          quotationId: quotationId || null,
          requestId: requestId || null,
          priceVariances
        });

        const po = await tx.purchaseOrder.create({
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

        // Lock Material Requirement & set ordered_quantity (Point 8)
        if (requestId) {
          const firstItemQty = items.length > 0 ? (Number(items[0].quantity) || 0) : 0;
          await tx.materialRequest.update({
            where: { id: requestId },
            data: {
              status: 'ORDERED',
              ordered_quantity: firstItemQty,
              notes: `Order placed via PO ${poNumber}`
            }
          });
        } else {
          for (const item of items) {
            if (!item.materialName) continue;
            const parsedQty = Number(item.quantity) || 0;
            const matchingReq = await tx.materialRequest.findFirst({
              where: {
                site_id: site.id,
                status: 'APPROVED',
                material: { name: { equals: item.materialName.trim(), mode: 'insensitive' } }
              }
            });
            if (matchingReq) {
              await tx.materialRequest.update({
                where: { id: matchingReq.id },
                data: {
                  status: 'ORDERED',
                  ordered_quantity: parsedQty,
                  notes: `Auto-linked and locked via PO ${poNumber}`
                }
              });
            }
          }
        }

        if (quotationId) {
          await tx.quotation.update({
            where: { id: quotationId },
            data: { status: 'ACCEPTED' }
          });
        }

        const vendor = await tx.vendor.findUnique({ where: { id: vendorId }, select: { name: true, phone: true } });
        const itemsSummary = items.map((i: any) => i.materialName).filter(Boolean).join(', ');
        await tx.financeDue.create({
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

        return po;
      });

      return NextResponse.json({ success: true, po: poResult });
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
      const { projectId, poId, quality, items, billUrl, deliveryDate, deliveryTime, deliverySpeed, remarks } = payload;
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
        const itemAcceptedMap: Array<{ material_id: string; acceptedQty: number; poItemId?: string }> = [];

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
          
          let materialId = poItem?.material_id;
          let orderedQty = poItem ? poItem.quantity : parsedQty;

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
              materialId = material.id;
            }
          }

          if (!materialId) continue;

          // ─── Determine Accepted vs Rejected Quantities (Point 6) ───
          let rejectedQty = 0;
          let acceptedQty = 0;

          if (quality === 'REJECTED') {
            acceptedQty = 0;
            rejectedQty = parsedQty;
          } else if (quality === 'PARTIAL') {
            rejectedQty = Math.max(0, Math.min(parsedQty, Number(item.rejectedQty) || 0));
            acceptedQty = Math.max(0, parsedQty - rejectedQty);
          } else {
            acceptedQty = parsedQty;
            rejectedQty = 0;
          }

          grnItemsData.push({
            material_id: materialId,
            ordered_qty: orderedQty,
            received_qty: parsedQty,
            rejected_qty: rejectedQty,
            damaged_qty: quality === 'REJECTED' ? parsedQty : (Number(item.damagedQty) || rejectedQty),
            short_supply: 0
          });

          itemAcceptedMap.push({
            material_id: materialId,
            acceptedQty,
            poItemId: poItem?.id
          });
        }
        
        if (grnItemsData.length === 0) throw new Error("No valid items to receive or received quantity is 0");

        let deliveryTimestamp = new Date();
        if (deliveryDate) {
          if (deliveryTime) {
            const parsedDt = new Date(`${deliveryDate}T${deliveryTime}`);
            if (!isNaN(parsedDt.getTime())) deliveryTimestamp = parsedDt;
            else deliveryTimestamp = new Date(deliveryDate);
          } else {
            deliveryTimestamp = new Date(deliveryDate);
          }
        }

        const speedTag = deliverySpeed ? `[Speed: ${deliverySpeed}]` : '';
        const timeTag = deliveryTime ? `[Time: ${deliveryTime}]` : '';
        const metaPrefix = [timeTag, speedTag].filter(Boolean).join(' ');
        const combinedRemarks = metaPrefix 
          ? `${metaPrefix} ${remarks || ''}`.trim() 
          : (remarks || null);

        const newGrn = await tx.goodsReceiptNote.create({
          data: {
            po_id: poId,
            site_id: siteId,
            received_by: user.sub,
            date: deliveryTimestamp,
            quality_status: quality || "GOOD",
            remarks: combinedRemarks,
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

        // ─── Inventory & PO Increment: ONLY for Accepted Quantities (Point 6) ───
        for (const record of itemAcceptedMap) {
          const { material_id, acceptedQty } = record;
          if (acceptedQty > 0) {
            // Update PO received quantity
            await tx.purchaseOrderItem.updateMany({
              where: { purchase_order_id: poId, material_id },
              data: { received_quantity: { increment: acceptedQty } }
            });
            
            let invItem = await tx.inventoryItem.findFirst({
              where: { site_id: siteId, material_id }
            });
            if (invItem) {
              await tx.inventoryItem.update({
                where: { id: invItem.id },
                data: { quantity: { increment: acceptedQty } }
              });
            } else {
              invItem = await tx.inventoryItem.create({
                data: { site_id: siteId, material_id, quantity: acceptedQty, company_id: user.company_id }
              });
            }
            await tx.inventoryTransaction.create({
              data: {
                item_id: invItem.id,
                type: 'GRN_RECEIPT',
                quantity: acceptedQty,
                user_id: user.sub,
                notes: `GRN ${newGrn.id} accepted receipt`
              }
            });
          }
        }

        // Update PO status based on accepted received quantities
        const updatedPoItems = await tx.purchaseOrderItem.findMany({
          where: { purchase_order_id: poId }
        });
        const allReceived = updatedPoItems.length > 0 && updatedPoItems.every(pi => (pi.received_quantity || 0) >= pi.quantity);
        const anyReceived = updatedPoItems.some(pi => (pi.received_quantity || 0) > 0);
        await tx.purchaseOrder.update({
          where: { id: poId },
          data: { status: allReceived ? 'DELIVERED' : (anyReceived ? 'PARTIAL' : po.status) }
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
