import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok, created, badRequest, serverError } from "@/lib/response";

// GET /api/crm/properties
export const GET = withAuth(async (req, user) => {
  try {
    if (!user.company_id) return badRequest("No company context");
    const properties = await prisma.crmProperty.findMany({
      where: { company_id: user.company_id },
      orderBy: { created_at: "desc" },
      include: {
        project: { select: { id: true, name: true } },
      },
    });
    return ok(properties);
  } catch (err: any) {
    console.error("CRM Properties GET error:", err);
    return serverError(err.message);
  }
});

// POST /api/crm/properties
export const POST = withAuth(async (req, user) => {
  try {
    if (!user.company_id) return badRequest("No company context");
    const body = await req.json();
    if (!body.name) return badRequest("Property name is required");

    const property = await prisma.crmProperty.create({
      data: {
        company_id: user.company_id,
        project_id: body.project_id || null,
        name: body.name,
        address: body.address || null,
        price: body.price || null,
        type: body.type || "Sale",
        beds: Number(body.beds) || 0,
        baths: Number(body.baths) || 0,
        sqft: body.sqft || null,
        status: body.status || "Available",
        image_url: body.image_url || null,
        featured: body.featured || false,
      },
    });

    return created(property, "Property listed");
  } catch (err: any) {
    console.error("CRM Property POST error:", err);
    return serverError(err.message);
  }
});
