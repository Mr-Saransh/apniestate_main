import { NextRequest } from "next/server";
import { withCrmAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok, created, badRequest, forbidden, notFound, serverError } from "@/lib/response";
import { getCrmUserContext } from "@/modules/crm/crm-permissions";

// GET /api/crm/deals
export const GET = withCrmAuth(async (req, user) => {
  try {
    if (!user.company_id) return badRequest("No company context");

    const crmCtx = await getCrmUserContext(user);
    if (!crmCtx) {
      return forbidden("You do not have CRM permissions in this company.");
    }

    const where: any = { company_id: user.company_id };

    // Telecaller scoping
    if (crmCtx.leadScope === "OWN") {
      where.OR = [
        { created_by: user.sub },
        { lead: { OR: [{ assigned_to: user.sub }, { created_by: user.sub }] } },
      ];
    }

    const deals = await prisma.crmDeal.findMany({
      where,
      orderBy: { deal_date: "desc" },
      include: {
        lead: { select: { id: true, name: true, initials: true, avatar_color: true, assigned_to: true } },
        project: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true, email: true } },
        channel_partner: { select: { id: true, name: true, referral_code: true, phone: true } },
      },
    });

    return ok(deals);
  } catch (err: any) {
    console.error("CRM Deals GET error:", err);
    return serverError(err.message);
  }
});

// POST /api/crm/deals
export const POST = withCrmAuth(async (req, user) => {
  try {
    if (!user.company_id) return badRequest("No company context");

    const crmCtx = await getCrmUserContext(user);
    if (!crmCtx) {
      return forbidden("You do not have CRM permissions in this company.");
    }

    const body = await req.json();
    if (!body.lead_id || !body.customer_name) {
      return badRequest("lead_id and customer_name are required");
    }

    const lead = await prisma.crmLead.findFirst({
      where: { id: body.lead_id, company_id: user.company_id },
    });
    if (!lead) return notFound("Lead");

    // Telecaller check
    if (crmCtx.leadScope === "OWN") {
      if (lead.assigned_to !== user.sub && lead.created_by !== user.sub) {
        return forbidden("You can only record deals for your own leads.");
      }
    }

    const dealValue = Number(body.deal_value) || 0;
    const amountReceived = Number(body.amount_received) || 0;
    const dueAmount = body.due_amount !== undefined ? Number(body.due_amount) : Math.max(0, dealValue - amountReceived);

    // Resolve Channel Partner if referral code or channel_partner_id passed
    let partnerId = body.channel_partner_id || null;
    let referralCode = body.referral_code?.trim() || null;

    if (!partnerId && referralCode) {
      const partner = await prisma.channelPartner.findFirst({
        where: { referral_code: referralCode, company_id: user.company_id },
      });
      if (partner) {
        partnerId = partner.id;
      }
    } else if (partnerId && !referralCode) {
      const partner = await prisma.channelPartner.findUnique({
        where: { id: partnerId },
        select: { referral_code: true },
      });
      if (partner) {
        referralCode = partner.referral_code;
      }
    }

    const deal = await prisma.crmDeal.create({
      data: {
        company_id: user.company_id,
        lead_id: body.lead_id,
        project_id: body.project_id || null,
        created_by: user.sub,
        customer_name: body.customer_name,
        property_name: body.property_name || null,
        deal_value: dealValue,
        commission: Number(body.commission) || 0,
        amount_received: amountReceived,
        due_amount: dueAmount,
        channel_partner_id: partnerId,
        referral_code: referralCode,
        payment_mode: body.payment_mode || "UPI",
        transaction_id: body.transaction_id || null,
        deal_date: body.deal_date ? new Date(body.deal_date) : new Date(),
        notes: body.notes || null,
      },
      include: {
        lead: { select: { id: true, name: true, initials: true, avatar_color: true } },
        channel_partner: { select: { id: true, name: true, referral_code: true, phone: true } },
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
