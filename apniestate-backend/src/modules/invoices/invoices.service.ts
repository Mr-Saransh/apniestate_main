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

export async function getInvoices(filters?: {
  vendor_id?: string;
  status?: string;
  project_id?: string;
  company_id?: string;
}) {
  const where: any = {};
  if (filters?.vendor_id) where.vendor_id = filters.vendor_id;
  if (filters?.status) where.status = filters.status;
  if (filters?.project_id) where.project_id = filters.project_id;
  if (filters?.company_id) where.company_id = filters.company_id;

  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      vendor: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
      site: { select: { id: true, name: true } },
      _count: { select: { payments: true } },
    },
    orderBy: { created_at: "desc" },
  });

  const invoiceIds = invoices.map((i) => i.id);
  if (invoiceIds.length > 0) {
    const attachments = await prisma.attachment.findMany({
      where: {
        entity_type: "INVOICE",
        entity_id: { in: invoiceIds },
        deleted_at: null,
      },
      select: {
        id: true,
        entity_id: true,
        file_name: true,
        secure_url: true,
        mime_type: true,
      },
    });

    const attMap = new Map<string, any[]>();
    attachments.forEach((att) => {
      const list = attMap.get(att.entity_id) || [];
      list.push(att);
      attMap.set(att.entity_id, list);
    });

    return invoices.map((inv) => ({
      ...inv,
      attachments: attMap.get(inv.id) || [],
    }));
  }

  return invoices;
}

export async function getInvoiceById(id: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      vendor: { select: { id: true, name: true, phone: true, email: true } },
      project: { select: { id: true, name: true } },
      site: { select: { id: true, name: true } },
      payments: { orderBy: { date: "desc" } },
    },
  });

  if (!invoice) return null;

  const attachments = await prisma.attachment.findMany({
    where: { entity_type: "INVOICE", entity_id: id, deleted_at: null },
    select: { id: true, file_name: true, secure_url: true, mime_type: true },
  });

  return { ...invoice, attachments };
}

export async function createInvoice(
  data: z.infer<typeof CreateInvoiceSchema>,
  companyIdOverride?: string | null
) {
  let companyId = companyIdOverride || null;

  // Resolve company_id from project if not provided
  if (!companyId && data.project_id) {
    const proj = await prisma.project.findUnique({
      where: { id: data.project_id },
      select: { company_id: true },
    });
    if (proj?.company_id) {
      companyId = proj.company_id;
    }
  }

  const total = data.amount + (data.tax_amount || 0);
  const invoiceNumber = data.number?.trim() || generateInvoiceNumber();

  return prisma.invoice.create({
    data: {
      number: invoiceNumber,
      vendor_id: data.vendor_id,
      project_id: data.project_id || null,
      site_id: data.site_id || null,
      amount: data.amount,
      tax_amount: data.tax_amount || 0,
      total,
      due_date: new Date(data.due_date),
      status: (data.status as any) || "DRAFT",
      notes: data.notes || null,
      company_id: companyId,
    },
    include: {
      vendor: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
      site: { select: { id: true, name: true } },
    },
  });
}

export async function updateInvoice(
  id: string,
  data: z.infer<typeof UpdateInvoiceSchema>
) {
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
    include: {
      vendor: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
      site: { select: { id: true, name: true } },
    },
  });
}

export async function deleteInvoice(id: string) {
  return prisma.invoice.delete({ where: { id } });
}

