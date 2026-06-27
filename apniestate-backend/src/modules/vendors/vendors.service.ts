import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { CreateVendorSchema, UpdateVendorSchema } from "./vendors.schema";

export async function getVendors(userId: string, companyId?: string | null) {
  if (!companyId) return [];
  return prisma.vendor.findMany({
    where: { company_id: companyId },
    include: {
      _count: { select: { invoices: true, payments: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getVendorById(id: string, companyId?: string | null) {
  if (!companyId) return null;
  return prisma.vendor.findFirst({
    where: { id, company_id: companyId },
    include: {
      payments: { orderBy: { date: "desc" }, take: 10 },
      invoices: { orderBy: { created_at: "desc" }, take: 10 },
      ratings: { include: { user: { select: { name: true } } }, orderBy: { created_at: "desc" } },
      _count: { select: { invoices: true, payments: true, ratings: true } },
    },
  });
}

export async function createVendor(data: any, userId: string, companyId?: string | null) {
  return prisma.vendor.create({
    data: {
      ...data,
      company_id: companyId || null
    }
  });
}

export async function updateVendor(id: string, data: any, companyId?: string | null) {
  if (!companyId) return null;
  const existing = await prisma.vendor.findFirst({ where: { id, company_id: companyId } });
  if (!existing) return null;
  return prisma.vendor.update({ where: { id }, data });
}

export async function deleteVendor(id: string, companyId?: string | null) {
  if (!companyId) return null;
  const existing = await prisma.vendor.findFirst({ where: { id, company_id: companyId } });
  if (!existing) return null;
  return prisma.vendor.update({
    where: { id },
    data: { is_active: false },
  });
}

// ─── Vendor Ratings ──────────────────────────────────────

export async function getVendorRatings(vendorId: string, companyId?: string | null) {
  if (!companyId) return [];
  const vendor = await prisma.vendor.findFirst({ where: { id: vendorId, company_id: companyId } });
  if (!vendor) return [];

  return prisma.vendorRating.findMany({
    where: { vendor_id: vendorId },
    include: { user: { select: { name: true } } },
    orderBy: { created_at: "desc" }
  });
}

export async function addVendorRating(vendorId: string, userId: string, score: number, comment?: string, companyId?: string | null) {
  if (!companyId) return null;
  const vendor = await prisma.vendor.findFirst({ where: { id: vendorId, company_id: companyId } });
  if (!vendor) return null;

  return prisma.vendorRating.create({
    data: { vendor_id: vendorId, user_id: userId, score, comment },
    include: { user: { select: { name: true } } }
  });
}
