import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok, created, badRequest } from "@/lib/response";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withAuth(async (req, user, ctx?: Ctx) => {
  try {
    const { id: projectId } = await ctx!.params;
    if (!projectId) return badRequest("Project ID is required");

    const units = await prisma.projectUnit.findMany({
      where: { project_id: projectId },
      orderBy: { created_at: "asc" }
    });

    return ok(units);
  } catch (err: any) {
    return Response.json({ success: false, error: err.message, stack: err.stack }, { status: 500 });
  }
});

export const POST = withAuth(async (req, user, ctx?: Ctx) => {
  try {
    const { id: projectId } = await ctx!.params;
    if (!projectId) return badRequest("Project ID is required");

    const body = await req.json();
    const { unit_number, type, custom_type, status, price, client_name } = body;

  if (!unit_number) return badRequest("Unit number is required");

  const unit = await prisma.projectUnit.create({
    data: {
      project_id: projectId,
      unit_number,
      type: type || "OTHER",
      custom_type: custom_type || null,
      status: status || "VACANT",
      price: price ? parseFloat(price) : null,
      client_name: client_name || null
    }
  });

  return created(unit, "Unit created successfully");
  } catch (err: any) {
    return Response.json({ success: false, error: err.message, stack: err.stack }, { status: 500 });
  }
});
