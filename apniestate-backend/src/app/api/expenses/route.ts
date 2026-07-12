import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok, created } from "@/lib/response";

export const GET = withAuth(async (req, user) => {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("project_id");

  if (!projectId) {
    return ok([]);
  }

  const [expenses, pos] = await Promise.all([
    prisma.expense.findMany({
      where: { project_id: projectId },
      orderBy: { date: 'desc' }
    }),
    prisma.purchaseOrder.findMany({
      where: { project_id: projectId, status: { in: ['APPROVED', 'SENT'] } },
      orderBy: { created_at: 'desc' },
      include: { vendor: true, items: { include: { material: true } } }
    })
  ]);

  const mappedPOs = pos.map(po => {
    // Generate a description from PO items
    const desc = po.items.map(i => i.material?.name || 'Material').join(', ');
    return {
      id: po.id,
      amount: po.total_amount,
      category: 'Materials',
      description: desc ? `Materials: ${desc}` : `PO #${po.po_number}`,
      date: po.created_at,
      status: po.status === 'APPROVED' ? 'APPROVED' : 'PENDING',
      project_id: po.project_id
    };
  });

  const merged = [...expenses, ...mappedPOs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return ok(merged);
});

export const POST = withAuth(async (req, user) => {
  const body = await req.json();

  const expense = await prisma.expense.create({
    data: {
      amount: Number(body.amount),
      category: body.category,
      description: body.description,
      project_id: body.project_id,
      date: new Date(body.date),
      user_id: user.sub,
      status: 'APPROVED', // Auto-approve manual expenses for now
    }
  });

  return created(expense, "Expense logged successfully");
});
