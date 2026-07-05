import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/middleware/auth.middleware";
import { ok } from "@/lib/response";

export const GET = withAuth(async (req: NextRequest, user) => {
  // Only return ACTIVE memberships
  const memberships = await prisma.companyMembership.findMany({
    where: { user_id: user.sub, status: "ACTIVE" },
    include: { company: true },
    orderBy: { last_active_at: { sort: "desc", nulls: "last" } },
  });

  return ok({ memberships }, "Workspaces fetched successfully");
});
