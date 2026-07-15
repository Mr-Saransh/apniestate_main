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
    select: { 
      id: true, 
      name: true, 
      email: true, 
      role: true, 
      phone: true, 
      city: true, 
      state: true, 
      is_active: true, 
      created_at: true,
      project_assignments: {
        select: {
          project_id: true,
          project: { select: { name: true } }
        }
      }
    },
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

export async function createUser(input: CreateUserInput, companyId?: string | null, assignerId?: string | null) {
  const whereClause = input.email ? { email: input.email } : { username: input.username };
  const existing = await prisma.user.findUnique({ where: whereClause as any });
  if (existing) return null; // conflict

  const password_hash = await bcrypt.hash(input.password, 12);
  
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { name: input.name, email: input.email || null, username: input.username || null, password_hash, role: input.role, phone: input.phone, city: input.city, state: input.state, company_id: companyId || null },
      select: { id: true, name: true, email: true, username: true, role: true, city: true, state: true, created_at: true },
    });

    if (input.project_ids && input.project_ids.length > 0 && companyId && assignerId) {
      await tx.projectAssignment.createMany({
        data: input.project_ids.map(pid => ({
          user_id: user.id,
          project_id: pid,
          company_id: companyId,
          role: user.role as any,
          assigned_by: assignerId
        }))
      });
    }

    return user;
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

export const assignProjectsToUser = async (userId: string, projectIds: string[], assignerId: string, companyId: string) => {
  const user = await prisma.user.findFirst({ where: { id: userId, company_id: companyId } });
  if (!user) return null;

  return prisma.$transaction(async (tx) => {
    // Delete existing assignments for this user in this company
    await tx.projectAssignment.deleteMany({
      where: {
        user_id: userId,
        company_id: companyId
      }
    });

    if (projectIds.length > 0) {
      // Create new assignments
      await tx.projectAssignment.createMany({
        data: projectIds.map(pid => ({
          user_id: userId,
          project_id: pid,
          company_id: companyId,
          role: user.role,
          assigned_by: assignerId
        }))
      });
    }
    
    return true;
  });
};
