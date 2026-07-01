import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/middleware/auth.middleware";
import { ok } from "@/lib/response";

export const GET = withAuth(async (req: NextRequest, user) => {
  const memberships = await prisma.companyMembership.findMany({
    where: { user_id: user.sub },
    include: { company: true },
  });

  return ok({ memberships }, "Workspaces fetched successfully");
});
