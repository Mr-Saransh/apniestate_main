import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok, created, badRequest, serverError } from "@/lib/response";

// GET /api/finance/dues
export const GET = withAuth(async (req, user) => {
  try {
    if (!user.company_id) return badRequest("Company context required");

    const url = new URL(req.url);
    const projectId = url.searchParams.get("project_id");
    const status = url.searchParams.get("status");
    const search = url.searchParams.get("search");

    const where: any = { company_id: user.company_id };

    if (projectId) {
      where.project_id = projectId;
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { party_name: { contains: search, mode: "insensitive" } },
        { title: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
      ];
    }

    const dues = await prisma.financeDue.findMany({
      where,
      orderBy: { created_at: "desc" },
      include: {
        vendor: { select: { id: true, name: true, phone: true, contact_person: true } },
        project: { select: { id: true, name: true } },
        purchase_order: { select: { id: true, po_number: true, total_amount: true } },
        payments: {
          orderBy: { payment_date: "desc" },
        },
      },
    });

    // Compute aggregation summaries
    let totalDueAmount = 0;
    let totalPaidAmount = 0;
    let totalAccruedAmount = 0;
    let countPending = 0;

    for (const d of dues) {
      totalAccruedAmount += d.total_amount || 0;
      totalPaidAmount += d.paid_amount || 0;
      if (d.status === "UNPAID" || d.status === "PARTIAL") {
        totalDueAmount += d.remaining_amount || 0;
        countPending += 1;
      }
    }

    return ok({
      dues,
      summary: {
        total_due_amount: totalDueAmount,
        total_paid_amount: totalPaidAmount,
        total_accrued_amount: totalAccruedAmount,
        count_pending: countPending,
        count_total: dues.length,
      },
    });
  } catch (err: any) {
    console.error("Finance Dues GET error:", err);
    return serverError(err.message);
  }
});

// POST /api/finance/dues
export const POST = withAuth(async (req, user) => {
  try {
    if (!user.company_id) return badRequest("Company context required");

    const body = await req.json();
    const {
      project_id,
      vendor_id,
      party_name,
      party_phone,
      party_type = "VENDOR",
      due_type = "MANUAL_DUE",
      title,
      total_amount,
      due_date,
      notes,
    } = body;

    if (!party_name || !title || !total_amount || Number(total_amount) <= 0) {
      return badRequest("Party name, title, and a valid total amount (> 0) are required");
    }

    const parsedAmount = Number(total_amount);

    const due = await prisma.financeDue.create({
      data: {
        company_id: user.company_id,
        project_id: project_id || null,
        vendor_id: vendor_id || null,
        party_name: party_name.trim(),
        party_phone: party_phone?.trim() || null,
        party_type: party_type || "VENDOR",
        due_type: due_type || "MANUAL_DUE",
        title: title.trim(),
        total_amount: parsedAmount,
        paid_amount: 0,
        remaining_amount: parsedAmount,
        due_date: due_date ? new Date(due_date) : null,
        status: "UNPAID",
        notes: notes?.trim() || null,
        created_by: user.sub,
      },
      include: {
        vendor: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        payments: true,
      },
    });

    return created(due, "Due entry created successfully");
  } catch (err: any) {
    console.error("Finance Dues POST error:", err);
    return serverError(err.message);
  }
});
