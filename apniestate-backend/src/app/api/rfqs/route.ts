import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok, created, badRequest } from "@/lib/response";

export const GET = withAuth(async (req, user) => {
  const dbUser = await prisma.user.findUnique({ where: { id: user.sub } });
  if (!dbUser?.company_id) return badRequest("User company not found");

  const rfqs = await prisma.rFQ.findMany({
    where: { company_id: dbUser.company_id },
    include: {
      items: {
        include: { material: { select: { id: true, name: true, unit: true } } }
      },
      quotations: true,
      creator: { select: { name: true } },
      site: { select: { name: true } },
    },
    orderBy: { created_at: "desc" },
  });
  return ok(rfqs);
});

export const POST = withAuth(async (req, user) => {
  const dbUser = await prisma.user.findUnique({ where: { id: user.sub } });
  if (!dbUser?.company_id) return badRequest("User company not found");

  const body = await req.json();
  const { site_id, due_date, notes, items } = body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return badRequest("Items are required");
  }

  const rfq = await prisma.rFQ.create({
    data: {
      site_id,
      company_id: dbUser.company_id,
      created_by: user.sub,
      status: "PUBLISHED",
      due_date: due_date ? new Date(due_date) : undefined,
      notes,
      items: {
        create: items.map((i: any) => ({
          material_id: i.material_id,
          quantity: Number(i.quantity)
        }))
      }
    },
    include: { items: true }
  });

  return created(rfq, "RFQ Created Successfully");
});
