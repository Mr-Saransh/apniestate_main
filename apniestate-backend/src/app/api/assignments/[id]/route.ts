import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { ok, badRequest } from "@/lib/response";
import { prisma } from "@/lib/prisma";

export const DELETE = withAuth(async (req, user, context) => {
  if (!user.company_id || user.role !== "BUILDER") return badRequest("Unauthorized");

  const { id } = context.params;
  const url = new URL(req.url);
  const type = url.searchParams.get("type"); // "project" or "site"

  try {
    if (type === "site") {
      await prisma.siteAssignment.delete({ where: { id, company_id: user.company_id } });
    } else {
      await prisma.projectAssignment.delete({ where: { id, company_id: user.company_id } });
    }
    return ok(null, "Assignment removed");
  } catch (error: any) {
    return badRequest("Failed to remove assignment");
  }
});
