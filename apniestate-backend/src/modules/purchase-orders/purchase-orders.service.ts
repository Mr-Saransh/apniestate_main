import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { CreatePurchaseOrderSchema, UpdatePurchaseOrderStatusSchema } from "./purchase-orders.schema";
import { PurchaseOrderStatus } from "@prisma/client";

export async function getPurchaseOrders(company_id?: string, projectId?: string) {
  const where: any = {};
  if (company_id) where.company_id = company_id;
  if (projectId) where.project_id = projectId;

  return await prisma.purchaseOrder.findMany({
    where,
    include: {
      vendor: { select: { id: true, name: true, contact_person: true } },
      items: true,
      _count: { select: { items: true } }
    },
    orderBy: { created_at: "desc" },
  });
}

export async function getPurchaseOrderById(id: string, company_id?: string) {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      vendor: true,
      items: {
        include: { material: { select: { id: true, name: true, unit: true } } }
      },
      project: { select: { id: true, name: true } },
      site: { select: { id: true, name: true } },
      creator: { select: { id: true, name: true } }
    }
  });

  if (!po || (company_id && po.company_id !== company_id)) {
    throw new Error("Purchase order not found");
  }

  return po;
}

export async function createPurchaseOrder(
  data: z.infer<typeof CreatePurchaseOrderSchema>,
  created_by: string,
  company_id: string
) {
  return await prisma.$transaction(async (tx) => {
    // Generate PO Number
    const count = await tx.purchaseOrder.count({ where: { company_id } });
    const po_number = `PO-${1000 + count + 1}`;

    let total_amount = 0;
    let total_gst = 0;

    const itemsData = data.items.map(item => {
      const itemTotal = item.quantity * item.unit_price;
      const gstAmount = itemTotal * (item.gst_rate / 100);
      
      total_amount += itemTotal;
      total_gst += gstAmount;

      return {
        material_id: item.material_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        gst_rate: item.gst_rate,
        total: itemTotal + gstAmount
      };
    });

    const final_amount = total_amount + total_gst;

    return await tx.purchaseOrder.create({
      data: {
        po_number,
        vendor_id: data.vendor_id,
        project_id: data.project_id,
        site_id: data.site_id,
        created_by,
        company_id,
        delivery_date: data.delivery_date ? new Date(data.delivery_date) : null,
        terms_conditions: data.terms_conditions,
        notes: data.notes,
        total_amount: final_amount,
        gst_amount: total_gst,
        discount_amount: 0,
        status: PurchaseOrderStatus.DRAFT,
        items: {
          create: itemsData
        }
      },
      include: {
        vendor: true,
        items: true
      }
    });
  });
}

export async function updatePurchaseOrderStatus(
  id: string,
  data: z.infer<typeof UpdatePurchaseOrderStatusSchema>,
  company_id?: string
) {
  const po = await getPurchaseOrderById(id, company_id);
  
  return await prisma.purchaseOrder.update({
    where: { id: po.id },
    data: { status: data.status },
    include: { vendor: true }
  });
}
