import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { CreateUserInput, UpdateUserInput } from "./users.schema";

export const getUsers = (companyId?: string | null) => {
  if (!companyId) return [];
  return prisma.user.findMany({
    where: { company_id: companyId },
    select: { id: true, name: true, email: true, role: true, phone: true, is_active: true, created_at: true },
    orderBy: { created_at: "desc" },
  });
};

export const getUserById = (id: string, companyId?: string | null) => {
  if (!companyId) return null;
  return prisma.user.findFirst({
    where: { id, company_id: companyId },
    select: { id: true, name: true, email: true, role: true, phone: true, is_active: true, created_at: true },
  });
};

export async function createUser(input: CreateUserInput, companyId?: string | null) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) return null; // conflict

  const password_hash = await bcrypt.hash(input.password, 12);
  return prisma.user.create({
    data: { name: input.name, email: input.email, password_hash, role: input.role, phone: input.phone, company_id: companyId || null },
    select: { id: true, name: true, email: true, role: true, created_at: true },
  });
}

export const updateUser = async (id: string, data: UpdateUserInput, companyId?: string | null) => {
  if (!companyId) return null;
  const existing = await prisma.user.findFirst({ where: { id, company_id: companyId } });
  if (!existing) return null;
  return prisma.user.update({ where: { id }, data, select: { id: true, name: true, email: true, role: true } });
};

export const deleteUser = async (id: string, companyId?: string | null) => {
  if (!companyId) return null;
  const existing = await prisma.user.findFirst({ where: { id, company_id: companyId } });
  if (!existing) return null;
  return prisma.user.update({ where: { id }, data: { is_active: false } });
};
