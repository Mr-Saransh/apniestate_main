import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok, badRequest } from "@/lib/response";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = withAuth(async (req, user, ctx?: Ctx) => {
  const { id: unitId } = await ctx!.params;
  if (!unitId) return badRequest("Unit ID is required");

  const body = await req.json();
  const { unit_number, type, custom_type, status, price, client_name } = body;

  const unit = await prisma.projectUnit.update({
    where: { id: unitId },
    data: {
      ...(unit_number && { unit_number }),
      ...(type && { type }),
      ...(custom_type !== undefined && { custom_type }),
      ...(status && { status }),
      ...(price !== undefined && { price: price ? parseFloat(price) : null }),
      ...(client_name !== undefined && { client_name })
    }
  });

  return ok(unit, "Unit updated successfully");
});

export const DELETE = withAuth(async (req, user, ctx?: Ctx) => {
  const { id: unitId } = await ctx!.params;
  if (!unitId) return badRequest("Unit ID is required");

  await prisma.projectUnit.delete({
    where: { id: unitId }
  });

  return ok({ success: true }, "Unit deleted successfully");
});
