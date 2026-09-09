import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok, created, badRequest } from "@/lib/response";
import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const QUOTATIONS_FILE = path.join(DATA_DIR, "client_quotations.json");

async function ensureFile() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(QUOTATIONS_FILE);
  } catch {
    await fs.writeFile(QUOTATIONS_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

async function readQuotations(): Promise<any[]> {
  await ensureFile();
  try {
    const raw = await fs.readFile(QUOTATIONS_FILE, "utf-8");
    return JSON.parse(raw || "[]");
  } catch {
    return [];
  }
}

async function writeQuotations(data: any[]): Promise<void> {
  await ensureFile();
  await fs.writeFile(QUOTATIONS_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export const GET = withAuth(async (req: NextRequest, user) => {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("project_id");
  const status = url.searchParams.get("status");

  const dbUser = await prisma.user.findUnique({
    where: { id: user.sub },
    select: { company_id: true }
  });

  const all = await readQuotations();
  let filtered = all;

  if (dbUser?.company_id) {
    filtered = filtered.filter(q => !q.company_id || q.company_id === dbUser.company_id);
  }

  if (projectId) {
    filtered = filtered.filter(q => !q.project_id || q.project_id === projectId);
  }

  if (status) {
    filtered = filtered.filter(q => q.status === status);
  }

  return ok(filtered);
});

export const POST = withAuth(async (req: NextRequest, user) => {
  const body = await req.json();

  if (!body.client_name || !body.items || !Array.isArray(body.items) || body.items.length === 0) {
    return badRequest("client_name and at least one item are required");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.sub },
    select: { company_id: true, name: true }
  });

  const all = await readQuotations();

  const count = all.length + 1;
  const quoteNum = body.quotation_number || `QTN-${new Date().getFullYear()}-${String(count).padStart(3, "0")}`;

  const subtotal = body.items.reduce((sum: number, it: any) => sum + (Number(it.quantity || 0) * Number(it.rate || 0)), 0);
  const discountAmount = body.discount_type === "PERCENT"
    ? (subtotal * (Number(body.discount_value || 0) / 100))
    : Number(body.discount_value || 0);
  const taxable = Math.max(0, subtotal - discountAmount);
  const taxRate = Number(body.tax_rate || 0);
  const taxAmount = (taxable * taxRate) / 100;
  const grandTotal = taxable + taxAmount;

  const newQuote = {
    id: `qtn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    quotation_number: quoteNum,
    project_id: body.project_id || null,
    company_id: dbUser?.company_id || null,
    created_by: user.sub,
    created_by_name: dbUser?.name || "User",
    client_name: body.client_name,
    client_email: body.client_email || null,
    client_phone: body.client_phone || null,
    client_address: body.client_address || null,
    date: body.date || new Date().toISOString().split("T")[0],
    valid_until: body.valid_until || null,
    status: body.status || "DRAFT",
    items: body.items.map((it: any, idx: number) => ({
      id: it.id || `item_${idx + 1}`,
      description: it.description || "",
      quantity: Number(it.quantity || 0),
      unit: it.unit || "nos",
      rate: Number(it.rate || 0),
      amount: Number(it.quantity || 0) * Number(it.rate || 0)
    })),
    subtotal,
    discount_type: body.discount_type || "FIXED",
    discount_value: Number(body.discount_value || 0),
    discount_amount: discountAmount,
    tax_rate: taxRate,
    tax_amount: taxAmount,
    grand_total: grandTotal,
    terms: body.terms || "1. Payment terms: 50% advance, balance on completion.\n2. Validity: 15 days from date of issue.",
    notes: body.notes || "",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  all.unshift(newQuote);
  await writeQuotations(all);

  return created(newQuote, "Quotation created successfully");
});
