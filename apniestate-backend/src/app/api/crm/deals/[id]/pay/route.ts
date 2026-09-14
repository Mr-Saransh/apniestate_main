import { NextRequest } from "next/server";
import { withCrmAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok, badRequest, notFound, serverError } from "@/lib/response";

// POST /api/crm/deals/[id]/pay
export const POST = withCrmAuth(async (req, user, context: any) => {
  try {
    if (!user.company_id) return badRequest("No company context");
    const params = await context.params;
    const dealId = params?.id;
    if (!dealId) return badRequest("Deal ID required");

    const deal = await prisma.crmDeal.findFirst({
      where: { id: dealId, company_id: user.company_id },
    });
    if (!deal) return notFound("Deal");

    const body = await req.json();
    const payAmount = Number(body.amount);
    if (!payAmount || isNaN(payAmount) || payAmount <= 0) {
      return badRequest("Payment amount must be greater than zero");
    }

    const currentDue = deal.due_amount > 0 ? deal.due_amount : Math.max(0, deal.deal_value - deal.amount_received);
    if (payAmount > currentDue + 0.01) {
      return badRequest(
        `Payment amount (₹${payAmount.toLocaleString("en-IN")}) exceeds the remaining due amount (₹${currentDue.toLocaleString("en-IN")})`
      );
    }

    const newReceived = deal.amount_received + payAmount;
    const newDue = Math.max(0, currentDue - payAmount);

    const updatedDeal = await prisma.crmDeal.update({
      where: { id: deal.id },
      data: {
        amount_received: newReceived,
        due_amount: newDue,
        notes: body.notes ? `${deal.notes ? deal.notes + "\n" : ""}[${new Date().toLocaleDateString()}]: Received ₹${payAmount.toLocaleString("en-IN")} via ${body.payment_mode || "UPI"} - ${body.notes}` : deal.notes,
      },
      include: {
        lead: { select: { id: true, name: true, initials: true, avatar_color: true } },
        channel_partner: { select: { id: true, name: true, referral_code: true, phone: true } },
      },
    });

    return ok(updatedDeal, "Customer payment recorded successfully");
  } catch (err: any) {
    console.error("CRM Deal Pay error:", err);
    return serverError(err.message);
  }
});
