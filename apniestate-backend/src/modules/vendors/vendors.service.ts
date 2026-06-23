import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { CreateVendorSchema, UpdateVendorSchema } from "./vendors.schema";

export async function getVendors(userId: string) {
  return prisma.vendor.findMany({
    include: {
      _count: { select: { invoices: true, payments: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getVendorById(id: string) {
  return prisma.vendor.findUnique({
    where: { id },
    include: {
      payments: { orderBy: { date: "desc" }, take: 10 },
      invoices: { orderBy: { created_at: "desc" }, take: 10 },
      ratings: { include: { user: { select: { name: true } } }, orderBy: { created_at: "desc" } },
      _count: { select: { invoices: true, payments: true, ratings: true } },
    },
  });
}

export async function createVendor(data: any, userId: string) {
  return prisma.vendor.create({ data });
}

export async function updateVendor(id: string, data: any) {
  return prisma.vendor.update({ where: { id }, data });
}

export async function deleteVendor(id: string) {
  return prisma.vendor.update({
    where: { id },
    data: { is_active: false },
  });
}

// ─── Vendor Ratings ──────────────────────────────────────

export async function getVendorRatings(vendorId: string) {
  return prisma.vendorRating.findMany({
    where: { vendor_id: vendorId },
    include: { user: { select: { name: true } } },
    orderBy: { created_at: "desc" }
  });
}

export async function addVendorRating(vendorId: string, userId: string, score: number, comment?: string) {
  return prisma.vendorRating.create({
    data: { vendor_id: vendorId, user_id: userId, score, comment },
    include: { user: { select: { name: true } } }
  });
}
