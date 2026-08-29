import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok, badRequest, notFound, serverError } from "@/lib/response";

// DELETE /api/crm/deals/[id]
export const DELETE = withAuth(async (req, user, context) => {
  try {
    if (!user.company_id) return badRequest("No company context");
    const { id } = await context.params;
    const existing = await prisma.crmDeal.findFirst({
      where: { id, company_id: user.company_id },
    });
    if (!existing) return notFound("Deal");

    await prisma.crmDeal.delete({ where: { id } });
    return ok(null, "Deal deleted");
  } catch (err: any) {
    console.error("CRM Deal DELETE error:", err);
    return serverError(err.message);
  }
});
