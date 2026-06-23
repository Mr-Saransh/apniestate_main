import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { CreatePaymentSchema, UpdatePaymentSchema } from "./payments.schema";

export async function getPayments(filters?: { vendor_id?: string; contractor_id?: string; status?: string }) {
  const where: any = {};
  if (filters?.vendor_id) where.vendor_id = filters.vendor_id;
  if (filters?.contractor_id) where.contractor_id = filters.contractor_id;
  if (filters?.status) where.status = filters.status;

  return prisma.payment.findMany({
    where,
    include: {
      vendor: { select: { id: true, name: true } },
      contractor: { select: { id: true, name: true } },
      invoice: { select: { id: true, number: true } },
    },
    orderBy: { date: "desc" },
  });
}

export async function getPaymentById(id: string) {
  return prisma.payment.findUnique({
    where: { id },
    include: {
      vendor: { select: { id: true, name: true } },
      contractor: { select: { id: true, name: true } },
      invoice: { select: { id: true, number: true, amount: true, total: true } },
    },
  });
}

export async function createPayment(data: z.infer<typeof CreatePaymentSchema>) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        amount: data.amount,
        vendor_id: data.vendor_id,
        contractor_id: data.contractor_id,
        invoice_id: data.invoice_id,
        date: new Date(data.date),
        method: data.method,
        reference: data.reference,
        notes: data.notes,
      },
      include: {
        vendor: { select: { id: true, name: true } },
        contractor: { select: { id: true, name: true } },
      },
    });

    // If payment is linked to an invoice, check if fully paid
    if (data.invoice_id) {
      const invoice = await tx.invoice.findUnique({ where: { id: data.invoice_id } });
      if (invoice) {
        const totalPayments = await tx.payment.aggregate({
          where: { invoice_id: data.invoice_id, status: { in: ["COMPLETED", "PENDING", "PROCESSING"] } },
          _sum: { amount: true },
        });
        if ((totalPayments._sum.amount || 0) >= invoice.total) {
          await tx.invoice.update({
            where: { id: data.invoice_id },
            data: { status: "PAID" },
          });
        }
      }
    }

    return payment;
  });
}

export async function updatePayment(id: string, data: z.infer<typeof UpdatePaymentSchema>) {
  return prisma.payment.update({
    where: { id },
    data,
    include: {
      vendor: { select: { id: true, name: true } },
      contractor: { select: { id: true, name: true } },
    },
  });
}

export async function deletePayment(id: string) {
  return prisma.payment.delete({ where: { id } });
}
