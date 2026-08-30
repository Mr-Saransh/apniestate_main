import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/middleware/auth.middleware";
import type { Role } from "@/types";
import bcrypt from "bcryptjs";

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const data = await req.json();
    const { email, username, password, name, role, crm_role, project_ids, phone } = data;

    if ((!email && !username) || !password || !name || !role) {
      return NextResponse.json(
        { success: false, error: "Missing required fields (email or username, password, name, role)" },
        { status: 400 }
      );
    }

    if (user.role !== "BUILDER" && user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Only builders can add team members." },
        { status: 403 }
      );
    }

    // Ensure company_id is present
    if (!user.company_id) {
      return NextResponse.json({ success: false, error: "No active workspace" }, { status: 400 });
    }

    const emailLower = email ? email.trim().toLowerCase() : null;
    const whereClause = emailLower ? { email: emailLower } : { username };
    const existing = await prisma.user.findUnique({ where: whereClause as any });

    const passwordHash = await bcrypt.hash(password, 10);

    const companyId = user.company_id!;
    const rolesToAdd: Role[] = [role as Role];
    if (crm_role && crm_role !== "NONE" && !rolesToAdd.includes(crm_role as Role)) {
      rolesToAdd.push(crm_role as Role);
    }

    if (existing) {
      // User already exists in database -> add to this company
      const mem = await prisma.companyMembership.findUnique({
        where: {
          user_id_company_id: {
            user_id: existing.id,
            company_id: companyId,
          },
        },
      });

      if (mem) {
        const mergedRoles = [...new Set([...mem.roles, ...rolesToAdd])] as Role[];
        await prisma.companyMembership.update({
          where: { id: mem.id },
          data: { roles: mergedRoles, status: "ACTIVE" },
        });
      } else {
        await prisma.companyMembership.create({
          data: {
            user_id: existing.id,
            company_id: companyId,
            roles: rolesToAdd,
            status: "ACTIVE",
          },
        });
      }

      // Update password & name
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          password_hash: passwordHash,
          name: name || existing.name,
          phone: phone || existing.phone,
        },
      });

      // Project assignments if applicable
      if (project_ids && Array.isArray(project_ids) && project_ids.length > 0 && role !== "BUILDER" && role !== "ADMIN") {
        await prisma.projectAssignment.deleteMany({
          where: { user_id: existing.id, company_id: companyId },
        });
        await prisma.projectAssignment.createMany({
          data: project_ids.map((pid: string) => ({
            user_id: existing.id,
            project_id: pid,
            company_id: companyId,
            role: role as Role,
            assigned_by: user.sub,
          })),
        });
      }

      return NextResponse.json({
        success: true,
        data: { id: existing.id, email: existing.email, username: existing.username, roles: rolesToAdd },
        message: "User added to company with active access",
      });
    }

    // Create New User
    const result = await prisma.$transaction(async (tx: any) => {
      const newUser = await tx.user.create({
        data: {
          email: emailLower,
          username: username || null,
          password_hash: passwordHash,
          name,
          role: role as Role,
          phone: phone || null,
          onboarded: true,
          profile_completed: true,
          company_id: companyId,
          last_workspace_id: companyId,
        },
      });

      await tx.companyMembership.create({
        data: {
          user_id: newUser.id,
          company_id: companyId,
          roles: rolesToAdd,
          status: "ACTIVE",
        },
      });

      if (project_ids && Array.isArray(project_ids) && project_ids.length > 0 && role !== "BUILDER" && role !== "ADMIN") {
        await tx.projectAssignment.createMany({
          data: project_ids.map((pid: string) => ({
            user_id: newUser.id,
            project_id: pid,
            company_id: companyId,
            role: role as Role,
            assigned_by: user.sub,
          })),
        });
      }

      return newUser;
    });

    return NextResponse.json({
      success: true,
      data: { id: result.id, email: result.email, username: result.username, roles: rolesToAdd },
      message: "User created successfully with active credentials",
    });
  } catch (error: any) {
    console.error("Create team member error:", error);
    return NextResponse.json({ success: false, error: "Failed to create team member" }, { status: 500 });
  }
});
