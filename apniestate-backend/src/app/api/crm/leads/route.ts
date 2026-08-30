import { NextRequest } from "next/server";
import { withCrmAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok, created, badRequest, forbidden, serverError } from "@/lib/response";
import { getCrmUserContext } from "@/modules/crm/crm-permissions";

// GET /api/crm/leads — list leads scoped to role hierarchy and company
export const GET = withCrmAuth(async (req, user) => {
  try {
    if (!user.company_id) return badRequest("No company context");

    const crmCtx = await getCrmUserContext(user);
    if (!crmCtx) {
      return forbidden("You do not have CRM permissions in this company.");
    }

    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const search = url.searchParams.get("search");
    const projectId = url.searchParams.get("project_id");
    const assignedTo = url.searchParams.get("assigned_to");

    const where: any = { company_id: user.company_id };

    // Role-based lead scoping
    if (crmCtx.leadScope === "OWN") {
      // Telecallers only see leads assigned to them or created by them
      where.OR = [
        { assigned_to: user.sub },
        { created_by: user.sub },
      ];
    } else {
      // CRM Managers and Builders can filter by assigned_to if requested
      if (assignedTo) {
        if (assignedTo === "unassigned") {
          where.assigned_to = null;
        } else {
          where.assigned_to = assignedTo;
        }
      }
    }

    if (status) where.status = status;
    if (projectId) where.project_id = projectId;
    if (search) {
      const searchFilter = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
      ];

      if (where.OR) {
        where.AND = [
          { OR: where.OR },
          { OR: searchFilter }
        ];
        delete where.OR;
      } else {
        where.OR = searchFilter;
      }
    }

    const leads = await prisma.crmLead.findMany({
      where,
      orderBy: { created_at: "desc" },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
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

    const crmCtx = await getCrmUserContext(user);
    if (!crmCtx) {
      return forbidden("You do not have CRM permissions in this company.");
    }

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

    // Enforce assignment rules:
    // Telecallers cannot assign leads to others; assigned_to must be self
    let assigned_to = user.sub;
    if (crmCtx.leadScope !== "OWN") {
      assigned_to = body.assigned_to !== undefined ? body.assigned_to : user.sub;
    }

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
        assigned_to,
        created_by: user.sub,
        notes: body.notes || null,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
    });

    return created(lead, "Lead created successfully");
  } catch (err: any) {
    console.error("CRM Leads POST error:", err);
    return serverError(err.message);
  }
});
