// @ts-nocheck
import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/response";

/**
 * GET /api/equipment
 * Returns all equipment with site and vendor details for the company
 */
export const GET = withAuth(async (req: NextRequest, user) => {
  const dbUser = await prisma.user.findUnique({ where: { id: user.sub } });
  const company_id = dbUser?.company_id;

  if (!company_id) {
    return ok([]);
  }

  const equipment = await prisma.equipment.findMany({
    where: { site: { company_id } },
    include: {
      site: { select: { id: true, name: true } },
      vendor: { select: { id: true, name: true } },
    },
    orderBy: { name: 'asc' },
  });

  return ok(equipment);
});

/**
 * POST /api/equipment
 * Create new equipment entry
 */
export const POST = withAuth(async (req: NextRequest, user) => {
  const body = await req.json();
  const { name, type, site_id, vendor_id, status } = body;

  if (!name || !type) {
    return new Response(JSON.stringify({ success: false, error: 'name and type are required' }), { status: 400 });
  }

  const equipment = await prisma.equipment.create({
    data: { name, type, site_id, vendor_id, status: status || 'AVAILABLE' },
    include: {
      site: { select: { id: true, name: true } },
      vendor: { select: { id: true, name: true } },
    },
  });

  return ok(equipment);
});
