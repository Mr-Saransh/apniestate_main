import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { CreateInvoiceSchema, UpdateInvoiceSchema } from "./invoices.schema";

function generateInvoiceNumber(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `INV-${year}${month}-${rand}`;
}

export async function getInvoices(filters?: { vendor_id?: string; status?: string }) {
  const where: any = {};
  if (filters?.vendor_id) where.vendor_id = filters.vendor_id;
  if (filters?.status) where.status = filters.status;

  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      vendor: { select: { id: true, name: true } },
      _count: { select: { payments: true } },
    },
    orderBy: { created_at: "desc" },
  });

  const invoiceIds = invoices.map(i => i.id);
  if (invoiceIds.length > 0) {
    const attachments = await prisma.attachment.findMany({
      where: {
        entity_type: 'INVOICE',
        entity_id: { in: invoiceIds },
        deleted_at: null,
      },
      select: {
        id: true,
        entity_id: true,
        file_name: true,
        secure_url: true,
        mime_type: true
      }
    });

    const attMap = new Map<string, any[]>();
    attachments.forEach(att => {
      const list = attMap.get(att.entity_id) || [];
      list.push(att);
      attMap.set(att.entity_id, list);
    });

    return invoices.map(inv => ({
      ...inv,
      attachments: attMap.get(inv.id) || []
    }));
  }

  return invoices;
}

export async function getInvoiceById(id: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      vendor: { select: { id: true, name: true, phone: true, email: true } },
      payments: { orderBy: { date: "desc" } },
    },
  });

  if (!invoice) return null;

  const attachments = await prisma.attachment.findMany({
    where: { entity_type: 'INVOICE', entity_id: id, deleted_at: null },
    select: { id: true, file_name: true, secure_url: true, mime_type: true }
  });

  return { ...invoice, attachments };
}

export async function createInvoice(data: z.infer<typeof CreateInvoiceSchema>) {
  const total = data.amount + (data.tax_amount || 0);
  return prisma.invoice.create({
    data: {
      number: generateInvoiceNumber(),
      vendor_id: data.vendor_id,
      amount: data.amount,
      tax_amount: data.tax_amount || 0,
      total,
      due_date: new Date(data.due_date),
      notes: data.notes,
    },
    include: {
      vendor: { select: { id: true, name: true } },
    },
  });
}

export async function updateInvoice(id: string, data: z.infer<typeof UpdateInvoiceSchema>) {
  const updateData: any = { ...data };
  if (data.due_date) updateData.due_date = new Date(data.due_date);
  if (data.amount !== undefined || data.tax_amount !== undefined) {
    const current = await prisma.invoice.findUnique({ where: { id } });
    if (current) {
      const newAmount = data.amount ?? current.amount;
      const newTax = data.tax_amount ?? (current.tax_amount || 0);
      updateData.total = newAmount + newTax;
    }
  }
  return prisma.invoice.update({
    where: { id },
    data: updateData,
    include: { vendor: { select: { id: true, name: true } } },
  });
}

export async function deleteInvoice(id: string) {
  return prisma.invoice.delete({ where: { id } });
}
