import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { ok, notFound, badRequest } from "@/lib/response";
import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const QUOTATIONS_FILE = path.join(DATA_DIR, "client_quotations.json");

async function readQuotations(): Promise<any[]> {
  try {
    const raw = await fs.readFile(QUOTATIONS_FILE, "utf-8");
    return JSON.parse(raw || "[]");
  } catch {
    return [];
  }
}

async function writeQuotations(data: any[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(QUOTATIONS_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export const GET = withAuth(async (req: NextRequest, user, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const all = await readQuotations();
  const quote = all.find(q => q.id === id);

  if (!quote) return notFound("Quotation not found");
  return ok(quote);
});

export const PUT = withAuth(async (req: NextRequest, user, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const body = await req.json();
  const all = await readQuotations();
  const index = all.findIndex(q => q.id === id);

  if (index === -1) return notFound("Quotation not found");

  const existing = all[index];
  const items = body.items || existing.items;

  const subtotal = items.reduce((sum: number, it: any) => sum + (Number(it.quantity || 0) * Number(it.rate || 0)), 0);
  const discountType = body.discount_type !== undefined ? body.discount_type : existing.discount_type;
  const discountValue = body.discount_value !== undefined ? Number(body.discount_value) : existing.discount_value;
  const discountAmount = discountType === "PERCENT" ? (subtotal * (discountValue / 100)) : discountValue;
  const taxable = Math.max(0, subtotal - discountAmount);
  const taxRate = body.tax_rate !== undefined ? Number(body.tax_rate) : existing.tax_rate;
  const taxAmount = (taxable * taxRate) / 100;
  const grandTotal = taxable + taxAmount;

  const updated = {
    ...existing,
    ...body,
    items: items.map((it: any, idx: number) => ({
      id: it.id || `item_${idx + 1}`,
      description: it.description || "",
      quantity: Number(it.quantity || 0),
      unit: it.unit || "nos",
      rate: Number(it.rate || 0),
      amount: Number(it.quantity || 0) * Number(it.rate || 0)
    })),
    subtotal,
    discount_type: discountType,
    discount_value: discountValue,
    discount_amount: discountAmount,
    tax_rate: taxRate,
    tax_amount: taxAmount,
    grand_total: grandTotal,
    updated_at: new Date().toISOString()
  };

  all[index] = updated;
  await writeQuotations(all);

  return ok(updated, "Quotation updated successfully");
});

export const DELETE = withAuth(async (req: NextRequest, user, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const all = await readQuotations();
  const filtered = all.filter(q => q.id !== id);

  if (filtered.length === all.length) return notFound("Quotation not found");

  await writeQuotations(filtered);
  return ok({ success: true }, "Quotation deleted successfully");
});
