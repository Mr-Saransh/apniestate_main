import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/response";

export const GET = withAuth(async (_req, user) => {
  const company_id = user.company_id || undefined;
  if (!company_id) {
    return ok([]);
  }

  let site = null;
  if (user.role === "SITE_SUPERVISOR") {
    site = await prisma.site.findFirst({
      where: { supervisor_id: user.sub, company_id }
    });
  }
  if (!site) {
    site = await prisma.site.findFirst({
      where: { company_id }
    });
  }

  if (!site) {
    return ok([]);
  }

  const requests = await prisma.materialRequest.findMany({
    where: {
      site_id: site.id,
      status: "SUBMITTED"
    },
    include: {
      material: { select: { name: true, unit: true } }
    },
    take: 5
  });

  const formatted = requests.map(r => ({
    id: r.id,
    materialName: r.material?.name || "Materials",
    quantity: r.quantity,
    unit: r.material?.unit || "units",
    status: r.status,
    created_at: r.created_at
  }));

  return ok(formatted);
});
