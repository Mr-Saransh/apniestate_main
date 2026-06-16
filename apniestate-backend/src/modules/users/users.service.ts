import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { CreateUserInput, UpdateUserInput } from "./users.schema";

export const getUsers = () =>
  prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, phone: true, is_active: true, created_at: true },
    orderBy: { created_at: "desc" },
  });

export const getUserById = (id: string) =>
  prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, phone: true, is_active: true, created_at: true },
  });

export async function createUser(input: CreateUserInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) return null; // conflict

  const password_hash = await bcrypt.hash(input.password, 12);
  return prisma.user.create({
    data: { name: input.name, email: input.email, password_hash, role: input.role, phone: input.phone },
    select: { id: true, name: true, email: true, role: true, created_at: true },
  });
}

export const updateUser = (id: string, data: UpdateUserInput) =>
  prisma.user.update({ where: { id }, data, select: { id: true, name: true, email: true, role: true } });

export const deleteUser = (id: string) =>
  prisma.user.update({ where: { id }, data: { is_active: false } });
