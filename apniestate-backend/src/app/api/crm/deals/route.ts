import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok, created, badRequest, serverError } from "@/lib/response";

// GET /api/crm/deals
export const GET = withAuth(async (req, user) => {
  try {
    if (!user.company_id) return badRequest("No company context");
    const deals = await prisma.crmDeal.findMany({
      where: { company_id: user.company_id },
      orderBy: { deal_date: "desc" },
      include: {
        lead: { select: { id: true, name: true, initials: true, avatar_color: true } },
        project: { select: { id: true, name: true } },
      },
    });
    return ok(deals);
  } catch (err: any) {
    console.error("CRM Deals GET error:", err);
    return serverError(err.message);
  }
});

// POST /api/crm/deals
export const POST = withAuth(async (req, user) => {
  try {
    if (!user.company_id) return badRequest("No company context");
    const body = await req.json();
    if (!body.lead_id || !body.customer_name) {
      return badRequest("lead_id and customer_name are required");
    }

    const deal = await prisma.crmDeal.create({
      data: {
        company_id: user.company_id,
        lead_id: body.lead_id,
        project_id: body.project_id || null,
        created_by: user.sub,
        customer_name: body.customer_name,
        property_name: body.property_name || null,
        deal_value: Number(body.deal_value) || 0,
        commission: Number(body.commission) || 0,
        amount_received: Number(body.amount_received) || 0,
        payment_mode: body.payment_mode || "UPI",
        transaction_id: body.transaction_id || null,
        deal_date: body.deal_date ? new Date(body.deal_date) : new Date(),
        notes: body.notes || null,
      },
    });

    // Auto-update lead status to BOOKED
    await prisma.crmLead.update({
      where: { id: body.lead_id },
      data: { status: "BOOKED" },
    });

    return created(deal, "Deal recorded");
  } catch (err: any) {
    console.error("CRM Deal POST error:", err);
    return serverError(err.message);
  }
});
