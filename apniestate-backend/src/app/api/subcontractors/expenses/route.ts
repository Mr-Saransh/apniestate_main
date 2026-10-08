import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { CreateSubContractorExpenseSchema } from "@/modules/subcontractors/subcontractors.schema";
import { submitExpense } from "@/modules/subcontractors/subcontractors.service";
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

    const expenses = await prisma.subContractorExpense.findMany({
      where,
      include: {
        assignment: {
          select: {
            id: true,
            work_type: true,
            allocated_budget: true,
            project: { select: { id: true, name: true } },
            user: { select: { id: true, name: true, email: true } },
          },
        },
        approver: { select: { id: true, name: true } },
      },
      orderBy: { date: "desc" },
    });

    return ok(expenses);
  } catch (error: any) {
    return badRequest(error.message || "Failed to fetch sub contractor expenses");
  }
});

export const POST = withAuth(async (req: NextRequest, user) => {
  if (user.role !== "SUB_CONTRACTOR") {
    return forbidden("Only Sub Contractors can submit subcontractor expenses.");
  }

  const parsed = await validateBody(req, CreateSubContractorExpenseSchema);
  if ("error" in parsed) return parsed.error;

  try {
    const expense = await submitExpense(parsed.data, user.sub);
    return created(expense, "Expense submitted successfully and pending approval");
  } catch (error: any) {
    return badRequest(error.message || "Failed to submit expense");
  }
});
