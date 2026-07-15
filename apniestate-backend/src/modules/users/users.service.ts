import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { CreateUserInput, UpdateUserInput } from "./users.schema";

export const getUsers = (companyId?: string | null) => {
  if (!companyId) return [];
  return prisma.user.findMany({
    where: { 
      is_active: true,
      OR: [
        { company_id: companyId },
        { memberships: { some: { company_id: companyId } } }
      ]
    },
    select: { id: true, name: true, email: true, role: true, phone: true, city: true, state: true, is_active: true, created_at: true },
    orderBy: { created_at: "desc" },
  });
};

export const getUserById = (id: string, companyId?: string | null) => {
  if (!companyId) return null;
  return prisma.user.findFirst({
    where: { 
      id, 
      OR: [
        { company_id: companyId },
        { memberships: { some: { company_id: companyId } } }
      ]
    },
    select: { id: true, name: true, email: true, role: true, phone: true, city: true, state: true, is_active: true, created_at: true },
  });
};

export async function createUser(input: CreateUserInput, companyId?: string | null) {
  const whereClause = input.email ? { email: input.email } : { username: input.username };
  const existing = await prisma.user.findUnique({ where: whereClause as any });
  if (existing) return null; // conflict

  const password_hash = await bcrypt.hash(input.password, 12);
  return prisma.user.create({
    data: { name: input.name, email: input.email || null, username: input.username || null, password_hash, role: input.role, phone: input.phone, city: input.city, state: input.state, company_id: companyId || null },
    select: { id: true, name: true, email: true, username: true, role: true, city: true, state: true, created_at: true },
  });
}

export const updateUser = async (id: string, data: UpdateUserInput, companyId?: string | null) => {
  if (!companyId) return null;
  const existing = await prisma.user.findFirst({ 
    where: { 
      id, 
      OR: [
        { company_id: companyId },
        { memberships: { some: { company_id: companyId } } }
      ]
    } 
  });
  if (!existing) return null;
  return prisma.user.update({ where: { id }, data, select: { id: true, name: true, email: true, role: true, phone: true, city: true, state: true } });
};

export const deleteUser = async (id: string, companyId?: string | null) => {
  if (!companyId) return null;
  const existing = await prisma.user.findFirst({ 
    where: { 
      id, 
      OR: [
        { company_id: companyId },
        { memberships: { some: { company_id: companyId } } }
      ]
    } 
  });
  if (!existing) return null;
  return prisma.user.update({ where: { id }, data: { is_active: false } });
};
