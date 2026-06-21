import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { CreateVendorSchema, UpdateVendorSchema } from "./vendors.schema";

export async function getVendors(userId: string) {
  return prisma.vendor.findMany({ orderBy: { name: "asc" } });
}

export async function getVendorById(id: string) {
  return prisma.vendor.findUnique({ where: { id } });
}

export async function createVendor(data: any, userId: string) {
  return prisma.vendor.create({ data });
}

export async function updateVendor(id: string, data: any) {
  return prisma.vendor.update({ where: { id }, data });
}

export async function deleteVendor(id: string) {
  return prisma.vendor.delete({ where: { id } });
}
