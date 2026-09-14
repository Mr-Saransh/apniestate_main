import { NextRequest } from "next/server";
import { withCrmAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok, badRequest, notFound, serverError } from "@/lib/response";

// DELETE /api/crm/channel-partners/[id]
export const DELETE = withCrmAuth(async (req, user, context: any) => {
  try {
    if (!user.company_id) return badRequest("Company context required");
    const params = await context.params;
    const id = params?.id;
    if (!id) return badRequest("ID is required");

    const partner = await prisma.channelPartner.findFirst({
      where: { id, company_id: user.company_id },
    });
    if (!partner) return notFound("Channel Partner not found");

    await prisma.channelPartner.delete({ where: { id } });
    return ok({ id }, "Channel Partner deleted");
  } catch (err: any) {
    console.error("Channel Partner DELETE error:", err);
    return serverError(err.message);
  }
});
