import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok, created, badRequest } from "@/lib/response";

export const GET = withAuth(async (req, user, { params }: any) => {
  const rfqId = params.id;
  const quotations = await prisma.quotation.findMany({
    where: { rfq_id: rfqId },
    include: {
      vendor: { select: { id: true, name: true, contact_person: true } },
      items: {
        include: { material: { select: { id: true, name: true, unit: true } } }
      }
    },
    orderBy: { created_at: "asc" }
  });
  return ok(quotations);
});

export const POST = withAuth(async (req, user, { params }: any) => {
  const rfqId = params.id;
  const body = await req.json();
  const { vendor_id, gst_amount, transportation, delivery_time, validity_days, terms, items } = body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return badRequest("Items are required");
  }

  // Calculate total amount
  const totalAmount = items.reduce((sum: number, item: any) => sum + (Number(item.rate) * Number(item.quantity)), 0) 
                      + Number(gst_amount || 0) 
                      + Number(transportation || 0);

  const quotation = await prisma.quotation.create({
    data: {
      rfq_id: rfqId,
      vendor_id,
      status: "SUBMITTED",
      total_amount: totalAmount,
      gst_amount: Number(gst_amount || 0),
      transportation: Number(transportation || 0),
      delivery_time,
      validity_days: validity_days ? Number(validity_days) : null,
      terms,
      items: {
        create: items.map((i: any) => ({
          material_id: i.material_id,
          quantity: Number(i.quantity),
          rate: Number(i.rate),
          total: Number(i.quantity) * Number(i.rate)
        }))
      }
    },
    include: { items: true, vendor: true }
  });

  return created(quotation, "Quotation submitted");
});
