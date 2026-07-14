import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/middleware/auth.middleware";
import bcrypt from "bcryptjs";

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const data = await req.json();
    const { email, username, password, name, role, project_id } = data;

    if ((!email && !username) || !password || !name || !role) {
      return NextResponse.json({ success: false, error: "Missing required fields (email or username, password, name, role)" }, { status: 400 });
    }

    if (user.role !== "BUILDER" && user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized. Only builders can add team members." }, { status: 403 });
    }

    // Ensure company_id is present
    if (!user.company_id) {
      return NextResponse.json({ success: false, error: "No active workspace" }, { status: 400 });
    }

    // Check if user exists
    const whereClause = email ? { email } : { username };
    const existing = await prisma.user.findUnique({ where: whereClause as any });
    if (existing) {
      const field = email ? "email" : "username";
      return NextResponse.json({ success: false, error: `Credentials already exist. A user with this ${field} is already registered.` }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Create User
      const newUser = await tx.user.create({
        data: {
          email: email || null,
          username: username || null,
          password_hash: passwordHash,
          name,
          role,
          onboarded: true,
          company_id: user.company_id,
          last_workspace_id: user.company_id,
        },
      });

      // 2. Create Membership in current company
      await tx.companyMembership.create({
        data: {
          user_id: newUser.id,
          company_id: user.company_id,
          roles: [role],
          status: "ACTIVE",
        },
      });

      // 3. Optional: Create ProjectAssignment if project_id is provided and role is not BUILDER/ADMIN
      if (project_id && role !== "BUILDER" && role !== "ADMIN") {
        await tx.projectAssignment.create({
          data: {
            user_id: newUser.id,
            project_id,
            company_id: user.company_id,
            role,
            assigned_by: user.sub,
          },
        });
      }

      return newUser;
    });

    return NextResponse.json({ success: true, data: { id: result.id, email: result.email, username: result.username } });
  } catch (error: any) {
    console.error("Create team member error:", error);
    return NextResponse.json({ success: false, error: "Failed to create team member" }, { status: 500 });
  }
});
