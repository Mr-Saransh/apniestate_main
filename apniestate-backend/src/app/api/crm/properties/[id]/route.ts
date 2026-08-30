import { NextRequest } from "next/server";
import { withCrmAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok, badRequest, notFound, serverError } from "@/lib/response";

// PUT /api/crm/properties/[id]
export const PUT = withCrmAuth(async (req, user, context) => {
  try {
    if (!user.company_id) return badRequest("No company context");
    const { id } = await context.params;
    const existing = await prisma.crmProperty.findFirst({
      where: { id, company_id: user.company_id },
    });
    if (!existing) return notFound("Property");

    const body = await req.json();
    const property = await prisma.crmProperty.update({
      where: { id },
      data: {
        name: body.name ?? existing.name,
        address: body.address !== undefined ? body.address : existing.address,
        price: body.price !== undefined ? body.price : existing.price,
        type: body.type ?? existing.type,
        beds: body.beds !== undefined ? Number(body.beds) : existing.beds,
        baths: body.baths !== undefined ? Number(body.baths) : existing.baths,
        sqft: body.sqft !== undefined ? body.sqft : existing.sqft,
        status: body.status ?? existing.status,
        image_url: body.image_url !== undefined ? body.image_url : existing.image_url,
        featured: body.featured !== undefined ? body.featured : existing.featured,
        project_id: body.project_id !== undefined ? body.project_id : existing.project_id,
      },
    });

    return ok(property, "Property updated");
  } catch (err: any) {
    console.error("CRM Property PUT error:", err);
    return serverError(err.message);
  }
});

// DELETE /api/crm/properties/[id]
export const DELETE = withCrmAuth(async (req, user, context) => {
  try {
    if (!user.company_id) return badRequest("No company context");
    const { id } = await context.params;
    const existing = await prisma.crmProperty.findFirst({
      where: { id, company_id: user.company_id },
    });
    if (!existing) return notFound("Property");

    await prisma.crmProperty.delete({ where: { id } });
    return ok(null, "Property deleted");
  } catch (err: any) {
    console.error("CRM Property DELETE error:", err);
    return serverError(err.message);
  }
});
