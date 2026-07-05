import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { ok, badRequest } from "@/lib/response";
import { prisma } from "@/lib/prisma";
import { Role } from "@/types";

export const GET = withAuth(async (req, user) => {
  if (!user.company_id) return badRequest("No active company");

  const url = new URL(req.url);
  const type = url.searchParams.get("type"); // "project" or "site"
  
  if (type === "site") {
    const assignments = await prisma.siteAssignment.findMany({
      where: { company_id: user.company_id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        site: { select: { id: true, name: true } },
        assigner: { select: { name: true } }
      }
    });
    return ok(assignments);
  } else {
    const assignments = await prisma.projectAssignment.findMany({
      where: { company_id: user.company_id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
        assigner: { select: { name: true } }
      }
    });
    return ok(assignments);
  }
});

export const POST = withAuth(async (req, user) => {
  if (!user.company_id || user.role !== "BUILDER") return badRequest("Unauthorized");

  const body = await req.json();
  const { user_id, type, entity_id, role } = body;

  if (!user_id || !type || !entity_id || !role) {
    return badRequest("Missing required fields (user_id, type, entity_id, role)");
  }

  try {
    if (type === "project") {
      const assignment = await prisma.projectAssignment.upsert({
        where: { user_id_project_id_role: { user_id, project_id: entity_id, role: role as Role } },
        create: { user_id, project_id: entity_id, company_id: user.company_id, role: role as Role, assigned_by: user.sub },
        update: {}
      });
      return ok(assignment, "Project assigned successfully");
    } else if (type === "site") {
      const assignment = await prisma.siteAssignment.upsert({
        where: { user_id_site_id_role: { user_id, site_id: entity_id, role: role as Role } },
        create: { user_id, site_id: entity_id, company_id: user.company_id, role: role as Role, assigned_by: user.sub },
        update: {}
      });
      return ok(assignment, "Site assigned successfully");
    }
    return badRequest("Invalid type");
  } catch (error: any) {
    return badRequest(error.message || "Failed to create assignment");
  }
});
