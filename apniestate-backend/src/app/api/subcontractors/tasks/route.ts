import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { CreateSubContractorTaskSchema } from "@/modules/subcontractors/subcontractors.schema";
import { createSubContractorTask } from "@/modules/subcontractors/subcontractors.service";
import { prisma } from "@/lib/prisma";
import { ok, created, forbidden, badRequest } from "@/lib/response";

export const GET = withAuth(async (req: NextRequest, user) => {
  const { searchParams } = new URL(req.url);
  const assignmentId = searchParams.get("assignment_id") || undefined;
  const projectId = searchParams.get("project_id") || undefined;

  try {
    const where: any = {};

    if (user.role === "SUB_CONTRACTOR") {
      where.assignment = {
        user_id: user.sub,
        ...(assignmentId ? { id: assignmentId } : {}),
      };
    } else {
      // Builder / Admin
      if (assignmentId) {
        where.assignment_id = assignmentId;
      }
      if (projectId) {
        where.assignment = {
          ...where.assignment,
          project_id: projectId,
        };
      }
      if (user.company_id) {
        where.assignment = {
          ...where.assignment,
          company_id: user.company_id,
        };
      }
    }

    const tasks = await prisma.subContractorTask.findMany({
      where,
      include: {
        assignment: {
          select: {
            id: true,
            work_type: true,
            project: { select: { id: true, name: true } },
            user: { select: { id: true, name: true } },
          },
        },
        approver: { select: { id: true, name: true } },
      },
      orderBy: { created_at: "desc" },
    });

    return ok(tasks);
  } catch (error: any) {
    return badRequest(error.message || "Failed to fetch sub contractor tasks");
  }
});

export const POST = withAuth(async (req: NextRequest, user) => {
  if (user.role !== "SUB_CONTRACTOR") {
    return forbidden("Only Sub Contractors can create tasks in this section.");
  }

  const parsed = await validateBody(req, CreateSubContractorTaskSchema);
  if ("error" in parsed) return parsed.error;

  try {
    const task = await createSubContractorTask(parsed.data, user.sub);
    return created(task, "Task created successfully");
  } catch (error: any) {
    return badRequest(error.message || "Failed to create task");
  }
});
