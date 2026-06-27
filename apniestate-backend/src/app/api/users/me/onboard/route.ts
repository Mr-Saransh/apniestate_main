import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/response";

export const PATCH = withAuth(async (req: NextRequest, user) => {
  const updated = await prisma.user.update({
    where: { id: user.sub },
    data: { onboarded: true }
  });

  return ok({
    id: updated.id,
    name: updated.name,
    email: updated.email,
    role: updated.role,
    company_id: updated.company_id,
    onboarded: updated.onboarded
  }, "User marked as onboarded");
});
