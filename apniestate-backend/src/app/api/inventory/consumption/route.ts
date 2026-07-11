import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok, created, badRequest } from "@/lib/response";

export const GET = withAuth(async (req, user) => {
  const consumptions = await prisma.materialConsumption.findMany({
    include: {
      material: { select: { id: true, name: true, unit: true } },
      site: { select: { name: true } }
    },
    orderBy: { created_at: "desc" }
  });
  return ok(consumptions);
});

export const POST = withAuth(async (req, user) => {
  const body = await req.json();
  const { site_id, material_id, quantity, dpr_id, boq_id } = body;

  if (!site_id || !material_id || !quantity) {
    return badRequest("Missing required fields");
  }

  const consumption = await prisma.materialConsumption.create({
    data: {
      site_id,
      material_id,
      quantity: Number(quantity),
      dpr_id,
      boq_id
    },
    include: { material: true, site: true }
  });

  return created(consumption, "Material Consumption logged");
});
