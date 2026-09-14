import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok, badRequest, notFound, serverError } from "@/lib/response";
import { PaymentMethod } from "@prisma/client";

// POST /api/finance/dues/[id]/pay
export const POST = withAuth(async (req, user, context: any) => {
  try {
    if (!user.company_id) return badRequest("Company context required");

    const params = await context.params;
    const dueId = params?.id;
    if (!dueId) return badRequest("Due ID is required");

    const due = await prisma.financeDue.findFirst({
      where: { id: dueId, company_id: user.company_id },
    });

    if (!due) return notFound("Due not found");

    if (due.status === "PAID" || due.remaining_amount <= 0) {
      return badRequest("This due is already fully paid.");
    }

    const body = await req.json();
    const {
      amount,
      payment_method = "UPI",
      payment_date = new Date().toISOString(),
      reference,
      notes,
    } = body;

    const payAmount = Number(amount);
    if (!payAmount || isNaN(payAmount) || payAmount <= 0) {
      return badRequest("Payment amount must be greater than zero.");
    }

    // Strict validation: cannot exceed remaining due amount
    if (payAmount > due.remaining_amount + 0.01) {
      return badRequest(
        `Payment amount (₹${payAmount.toLocaleString("en-IN")}) cannot exceed the remaining due amount (₹${due.remaining_amount.toLocaleString("en-IN")}).`
      );
    }

    // Map payment method
    let method: PaymentMethod = PaymentMethod.UPI;
    const upperMethod = String(payment_method).toUpperCase();
    if (upperMethod === "CASH") method = PaymentMethod.CASH;
    else if (upperMethod === "BANK_TRANSFER" || upperMethod === "DIRECT_TRANSFER" || upperMethod === "NEFT") method = PaymentMethod.BANK_TRANSFER;
    else if (upperMethod === "CHEQUE") method = PaymentMethod.CHEQUE;
    else if (upperMethod === "OTHER" || upperMethod === "CARD") method = PaymentMethod.OTHER;

    // Transactional payment processing
    const updatedDue = await prisma.$transaction(async (tx) => {
      const newPaidAmount = due.paid_amount + payAmount;
      const newRemaining = Math.max(0, due.total_amount - newPaidAmount);
      const newStatus = newRemaining <= 0.01 ? "PAID" : "PARTIAL";

      // 1. Create DuePayment
      await tx.duePayment.create({
        data: {
          due_id: due.id,
          company_id: user.company_id!,
          amount: payAmount,
          payment_date: new Date(payment_date),
          payment_method: method,
          reference: reference || null,
          notes: notes || null,
          created_by: user.sub,
        },
      });

      // 2. Update FinanceDue
      const refreshed = await tx.financeDue.update({
        where: { id: due.id },
        data: {
          paid_amount: newPaidAmount,
          remaining_amount: newRemaining,
          status: newStatus,
        },
        include: {
          vendor: { select: { id: true, name: true } },
          project: { select: { id: true, name: true } },
          payments: { orderBy: { payment_date: "desc" } },
        },
      });

      // 3. Intelligently capture transaction in Cashbook (DEBIT)
      const cashbookCategory = due.due_type === "VENDOR_PURCHASE" ? "Materials" : "Other Expense";
      await tx.cashbook.create({
        data: {
          company_id: user.company_id!,
          project_id: due.project_id || null,
          recorded_by: user.sub,
          type: "DEBIT",
          amount: payAmount,
          category: cashbookCategory,
          description: `Due payment: ${due.title} (${due.party_name})`,
          reference: reference || `DUE-PAY-${due.id.slice(-6)}`,
          date: new Date(payment_date),
        },
      });

      return refreshed;
    });

    return ok(updatedDue, "Payment recorded successfully and reflected in finance");
  } catch (err: any) {
    console.error("Due Payment POST error:", err);
    return serverError(err.message);
  }
});
