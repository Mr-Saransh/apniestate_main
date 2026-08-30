import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/types";
import type { CreateUserInput, UpdateUserInput } from "./users.schema";

export const getUsers = async (companyId?: string | null) => {
  if (!companyId) return [];
  const users = await prisma.user.findMany({
    where: {
      is_active: true,
      OR: [
        { company_id: companyId },
        { memberships: { some: { company_id: companyId, status: "ACTIVE" } } },
      ],
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
      memberships: {
        where: { company_id: companyId },
        select: {
          id: true,
          roles: true,
          status: true,
        },
      },
      project_assignments: {
        where: { company_id: companyId },
        select: {
          project_id: true,
          project: { select: { name: true } },
        },
      },
    },
    orderBy: { created_at: "desc" },
  });

  return users.map((u) => {
    const mem = u.memberships[0];
    const roles: string[] = mem ? mem.roles : [u.role];
    const hasCrmManager = roles.includes("CRM_MANAGER");
    const hasTelecaller = roles.includes("TELECALLER") || roles.includes("SALES_EXECUTIVE");
    const crmRole = hasCrmManager ? "CRM_MANAGER" : hasTelecaller ? "TELECALLER" : null;

    return {
      ...u,
      company_roles: roles,
      crm_role: crmRole,
      has_crm_access: Boolean(crmRole || roles.includes("BUILDER") || roles.includes("ADMIN")),
    };
  });
};

export const getUserById = (id: string, companyId?: string | null) => {
  if (!companyId) return null;
  return prisma.user.findFirst({
    where: {
      id,
      OR: [
        { company_id: companyId },
        { memberships: { some: { company_id: companyId } } },
      ],
    },
    select: { id: true, name: true, email: true, role: true, phone: true, city: true, state: true, is_active: true, created_at: true },
  });
};

export async function createUser(input: CreateUserInput, companyId?: string | null, assignerId?: string | null) {
  const whereClause = input.email ? { email: input.email.toLowerCase() } : { username: input.username };
  const existing = await prisma.user.findUnique({ where: whereClause as any });
  const password_hash = await bcrypt.hash(input.password, 12);
  const baseRole = (input.role || "SITE_SUPERVISOR") as Role;
  const crmRole = input.crm_role && input.crm_role !== "NONE" ? (input.crm_role as Role) : null;

  const targetRoles: Role[] = [baseRole];
  if (crmRole && !targetRoles.includes(crmRole)) {
    targetRoles.push(crmRole);
  }

  if (existing) {
    // User already exists in Apni Estate
    return prisma.$transaction(async (tx) => {
      // Update password if provided
      await tx.user.update({
        where: { id: existing.id },
        data: {
          password_hash,
          name: input.name || existing.name,
          phone: input.phone || existing.phone,
        },
      });

      if (companyId) {
        // Upsert CompanyMembership
        const mem = await tx.companyMembership.findUnique({
          where: {
            user_id_company_id: {
              user_id: existing.id,
              company_id: companyId,
            },
          },
        });

        if (mem) {
          const mergedRoles = [...new Set([...mem.roles, ...targetRoles])] as Role[];
          await tx.companyMembership.update({
            where: { id: mem.id },
            data: { roles: mergedRoles, status: "ACTIVE" },
          });
        } else {
          await tx.companyMembership.create({
            data: {
              user_id: existing.id,
              company_id: companyId,
              roles: targetRoles,
              status: "ACTIVE",
            },
          });
        }
      }

      if (input.project_ids && input.project_ids.length > 0 && companyId && assignerId) {
        await tx.projectAssignment.deleteMany({
          where: { user_id: existing.id, company_id: companyId },
        });
        await tx.projectAssignment.createMany({
          data: input.project_ids.map((pid) => ({
            user_id: existing.id,
            project_id: pid,
            company_id: companyId,
            role: baseRole as any,
            assigned_by: assignerId,
          })),
        });
      }

      return {
        id: existing.id,
        name: existing.name,
        email: existing.email,
        username: existing.username,
        role: baseRole,
        crm_role: crmRole,
        created_at: existing.created_at,
      };
    });
  }

  // New User creation
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: input.name,
        email: input.email ? input.email.toLowerCase() : null,
        username: input.username || null,
        password_hash,
        role: baseRole,
        phone: input.phone,
        city: input.city,
        state: input.state,
        company_id: companyId || null,
        profile_completed: true,
        onboarded: true,
      },
      select: { id: true, name: true, email: true, username: true, role: true, city: true, state: true, created_at: true },
    });

    if (companyId) {
      await tx.companyMembership.create({
        data: {
          user_id: user.id,
          company_id: companyId,
          roles: targetRoles,
          status: "ACTIVE",
        },
      });
    }

    if (input.project_ids && input.project_ids.length > 0 && companyId && assignerId) {
      await tx.projectAssignment.createMany({
        data: input.project_ids.map((pid) => ({
          user_id: user.id,
          project_id: pid,
          company_id: companyId,
          role: baseRole as any,
          assigned_by: assignerId,
        })),
      });
    }

    return {
      ...user,
      crm_role: crmRole,
    };
  });
}

export const updateUser = async (id: string, data: UpdateUserInput, companyId?: string | null) => {
  if (!companyId) return null;
  const existing = await prisma.user.findFirst({
    where: {
      id,
      OR: [
        { company_id: companyId },
        { memberships: { some: { company_id: companyId } } },
      ],
    },
  });
  if (!existing) return null;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone,
        city: data.city,
        state: data.state,
        role: data.role as Role | undefined,
      },
      select: { id: true, name: true, email: true, role: true, phone: true, city: true, state: true },
    });

    if (data.crm_role !== undefined && companyId) {
      const mem = await tx.companyMembership.findUnique({
        where: { user_id_company_id: { user_id: id, company_id: companyId } },
      });
      if (mem) {
        // Remove existing CRM roles
        let roles = mem.roles.filter(
          (r) => !["CRM_MANAGER", "TELECALLER", "SALES_EXECUTIVE"].includes(r)
        );
        if (data.crm_role && data.crm_role !== "NONE") {
          roles.push(data.crm_role as Role);
        }
        await tx.companyMembership.update({
          where: { id: mem.id },
          data: { roles },
        });
      }
    }

    return updated;
  });
};

export const updateUserCrmAccess = async (
  userId: string,
  companyId: string,
  crmRole: "CRM_MANAGER" | "TELECALLER" | null
) => {
  const mem = await prisma.companyMembership.findUnique({
    where: { user_id_company_id: { user_id: userId, company_id: companyId } },
  });

  if (!mem) return null;

  let roles = mem.roles.filter(
    (r) => !["CRM_MANAGER", "TELECALLER", "SALES_EXECUTIVE"].includes(r)
  );
  if (crmRole) {
    roles.push(crmRole);
  }

  return prisma.companyMembership.update({
    where: { id: mem.id },
    data: { roles },
  });
};

export const deleteUser = async (id: string, companyId?: string | null) => {
  if (!companyId) return null;
  const existing = await prisma.user.findFirst({
    where: {
      id,
      OR: [
        { company_id: companyId },
        { memberships: { some: { company_id: companyId } } },
      ],
    },
  });
  if (!existing) return null;

  await prisma.companyMembership.updateMany({
    where: { user_id: id, company_id: companyId },
    data: { status: "INACTIVE" },
  });

  return prisma.user.update({ where: { id }, data: { is_active: false } });
};

export const assignProjectsToUser = async (userId: string, projectIds: string[], assignerId: string, companyId: string) => {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      OR: [
        { company_id: companyId },
        { memberships: { some: { company_id: companyId } } },
      ],
    },
  });
  if (!user) return null;

  return prisma.$transaction(async (tx) => {
    await tx.projectAssignment.deleteMany({
      where: {
        user_id: userId,
        company_id: companyId,
      },
    });

    if (projectIds.length > 0) {
      await tx.projectAssignment.createMany({
        data: projectIds.map((pid) => ({
          user_id: userId,
          project_id: pid,
          company_id: companyId,
          role: user.role,
          assigned_by: assignerId,
        })),
      });
    }

    return true;
  });
};
