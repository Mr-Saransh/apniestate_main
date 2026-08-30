import { NextRequest } from "next/server";
import { withCrmAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok, created, badRequest, serverError } from "@/lib/response";

// GET /api/crm/leads — list all leads for company
export const GET = withCrmAuth(async (req, user) => {
  try {
    if (!user.company_id) return badRequest("No company context");
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const search = url.searchParams.get("search");
    const projectId = url.searchParams.get("project_id");

    const where: any = { company_id: user.company_id };
    if (status) where.status = status;
    if (projectId) where.project_id = projectId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
      ];
    }

    const leads = await prisma.crmLead.findMany({
      where,
      orderBy: { created_at: "desc" },
      include: {
        assignee: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        _count: { select: { followups: true, deals: true } },
      },
    });

    return ok(leads);
  } catch (err: any) {
    console.error("CRM Leads GET error:", err);
    return serverError(err.message);
  }
});

// POST /api/crm/leads — create a new lead
export const POST = withCrmAuth(async (req, user) => {
  try {
    if (!user.company_id) return badRequest("No company context");
    const body = await req.json();

    if (!body.name) return badRequest("Lead name is required");

    // Derive initials
    const initials = body.name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    // Random avatar color from palette
    const colors = ["#2648E7", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B", "#EF4444"];
    const avatar_color = colors[Math.floor(Math.random() * colors.length)];

    const lead = await prisma.crmLead.create({
      data: {
        company_id: user.company_id,
        project_id: body.project_id || null,
        name: body.name,
        initials,
        avatar_color,
        phone: body.phone || null,
        email: body.email || null,
        type: body.type || "BUYER",
        status: body.status || "NEW",
        priority: body.priority || "MEDIUM",
        source: body.source || "Direct",
        budget: body.budget || null,
        city: body.city || null,
        tags: body.tags || [],
        assigned_to: body.assigned_to || user.sub,
        created_by: user.sub,
        notes: body.notes || null,
      },
    });

    return created(lead, "Lead created successfully");
  } catch (err: any) {
    console.error("CRM Leads POST error:", err);
    return serverError(err.message);
  }
});
