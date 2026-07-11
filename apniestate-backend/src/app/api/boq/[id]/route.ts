import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/response";

export const DELETE = withAuth(async (_req, user, context) => {
  const params = await context.params;
  
  // Only allow deleting DRAFT or empty APPROVED BOQs for testing
  await prisma.bOQ.delete({
    where: { id: params.id }
  });
  
  return ok({ success: true }, "BOQ Deleted.");
});
