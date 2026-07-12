import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok, badRequest } from "@/lib/response";

export const GET = withAuth(async (req: NextRequest, user) => {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("project_id");
  const siteId = url.searchParams.get("site_id");

  const where: any = { company_id: user.company_id };
  if (projectId) where.project_id = projectId;
  if (siteId) where.site_id = siteId;

  const equipment = await prisma.equipment.findMany({
    where,
    include: {
      site: { select: { id: true, name: true, project_id: true } },
      vendor: { select: { id: true, name: true } },
    },
    orderBy: { name: 'asc' },
  });

  return ok(equipment);
});

export const POST = withAuth(async (req: NextRequest, user) => {
  const body = await req.json();
  const { name, type, site_id, project_id, vendor_id, ownership, rental_cost, fuel_cost, operator_cost, maintenance_cost, status } = body;

  if (!name || !type) {
    return badRequest('name and type are required');
  }

  const equipment = await prisma.equipment.create({
    data: { 
        company_id: user.company_id,
        name, 
        type, 
        site_id, 
        project_id,
        vendor_id, 
        ownership: ownership || 'OWNED',
        rental_cost: Number(rental_cost) || 0,
        fuel_cost: Number(fuel_cost) || 0,
        operator_cost: Number(operator_cost) || 0,
        maintenance_cost: Number(maintenance_cost) || 0,
        status: status || 'AVAILABLE' 
    },
    include: {
      site: { select: { id: true, name: true } },
      vendor: { select: { id: true, name: true } },
    },
  });

  return ok(equipment);
});

export const PUT = withAuth(async (req: NextRequest, user) => {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return badRequest("Equipment ID is required");

  const body = await req.json();
  
  const equipment = await prisma.equipment.updateMany({
    where: { id, company_id: user.company_id },
    data: { 
        name: body.name, 
        type: body.type, 
        site_id: body.site_id, 
        project_id: body.project_id,
        vendor_id: body.vendor_id, 
        ownership: body.ownership,
        rental_cost: body.rental_cost !== undefined ? Number(body.rental_cost) : undefined,
        fuel_cost: body.fuel_cost !== undefined ? Number(body.fuel_cost) : undefined,
        operator_cost: body.operator_cost !== undefined ? Number(body.operator_cost) : undefined,
        maintenance_cost: body.maintenance_cost !== undefined ? Number(body.maintenance_cost) : undefined,
        status: body.status 
    },
  });

  return ok(equipment);
});

export const DELETE = withAuth(async (req: NextRequest, user) => {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return badRequest("Equipment ID is required");

  await prisma.equipment.deleteMany({
    where: { id, company_id: user.company_id },
  });

  return ok({ deleted: true });
});
