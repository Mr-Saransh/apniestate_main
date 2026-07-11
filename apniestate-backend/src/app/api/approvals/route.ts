// @ts-nocheck
import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok, created, badRequest } from "@/lib/response";

// GET /api/approvals — Get pending approvals + chains
export const GET = withAuth(async (req: NextRequest, user) => {
  const dbUser = await prisma.user.findUnique({ where: { id: user.sub } });
  const companyId = dbUser?.company_id;
  if (!companyId) return ok({ chains: [], pending: [], logs: [] });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // "chains", "pending", "logs"
  const entityType = searchParams.get("entity_type");
  const entityId = searchParams.get("entity_id");

  if (type === "chains") {
    const chains = await prisma.approvalChain.findMany({
      where: { company_id: companyId },
      include: { steps: { orderBy: { step_order: "asc" } } }
    });
    return ok(chains);
  }

  if (type === "logs" && entityType && entityId) {
    const logs = await prisma.approvalLog.findMany({
      where: { entity_type: entityType, entity_id: entityId },
      include: { user: { select: { name: true, email: true, role: true } } },
      orderBy: { created_at: "asc" }
    });
    return ok(logs);
  }

  // Default: return pending items summary
  const pendingExpenses = await prisma.expense.count({ where: { company_id: companyId, status: "PENDING" } });
  const pendingPOs = await prisma.purchaseOrder.count({ where: { company_id: companyId, status: "PENDING" } });
  const pendingLeaves = await prisma.leave.count({ where: { worker: { company_id: companyId }, status: "PENDING" } });
  const pendingMRs = await prisma.materialRequest.count({ where: { site: { company_id: companyId }, status: "SUBMITTED" } });

  const chains = await prisma.approvalChain.findMany({
    where: { company_id: companyId },
    include: { steps: { orderBy: { step_order: "asc" } } }
  });

  const recentLogs = await prisma.approvalLog.findMany({
    where: { company_id: companyId },
    include: { user: { select: { name: true, role: true } } },
    orderBy: { created_at: "desc" },
    take: 20
  });

  return ok({
    summary: {
      expenses: pendingExpenses,
      purchaseOrders: pendingPOs,
      leaves: pendingLeaves,
      materialRequests: pendingMRs,
      total: pendingExpenses + pendingPOs + pendingLeaves + pendingMRs
    },
    chains,
    recentLogs
  });
});

// POST /api/approvals — Create chain or process approval action
export const POST = withAuth(async (req: NextRequest, user) => {
  const body = await req.json();
  const dbUser = await prisma.user.findUnique({ where: { id: user.sub } });
  const companyId = dbUser?.company_id;
  if (!companyId) return badRequest("Company not found");

  // Create or update approval chain
  if (body.action === "create_chain") {
    const { entity_type, name, steps } = body;
    if (!entity_type || !name || !steps?.length) {
      return badRequest("entity_type, name, and steps are required");
    }

    // Upsert: delete existing chain for this entity_type, then create new
    const existing = await prisma.approvalChain.findUnique({
      where: { company_id_entity_type: { company_id: companyId, entity_type } }
    });
    if (existing) {
      await prisma.approvalStep.deleteMany({ where: { chain_id: existing.id } });
      await prisma.approvalChain.delete({ where: { id: existing.id } });
    }

    const chain = await prisma.approvalChain.create({
      data: {
        company_id: companyId,
        entity_type,
        name,
        steps: {
          create: steps.map((s: any, idx: number) => ({
            step_order: idx + 1,
            role: s.role,
            label: s.label || null
          }))
        }
      },
      include: { steps: { orderBy: { step_order: "asc" } } }
    });

    return created(chain);
  }

  // Process approval action
  if (body.action === "approve" || body.action === "reject") {
    const { entity_type, entity_id, comments } = body;
    if (!entity_type || !entity_id) {
      return badRequest("entity_type and entity_id are required");
    }

    // Get the approval chain
    const chain = await prisma.approvalChain.findUnique({
      where: { company_id_entity_type: { company_id: companyId, entity_type } },
      include: { steps: { orderBy: { step_order: "asc" } } }
    });

    // Get existing approval logs for this entity
    const existingLogs = await prisma.approvalLog.findMany({
      where: { entity_type, entity_id },
      orderBy: { step_order: "desc" },
      take: 1
    });

    const currentStep = existingLogs.length > 0 ? existingLogs[0].step_order + 1 : 1;
    const totalSteps = chain?.steps.length || 1;

    // Create audit log
    const log = await prisma.approvalLog.create({
      data: {
        entity_type,
        entity_id,
        step_order: currentStep,
        role: dbUser?.role || "BUILDER",
        action: body.action === "approve" ? "APPROVED" : "REJECTED",
        user_id: user.sub,
        comments: comments || null,
        company_id: companyId
      }
    });

    // If final step approved or rejected, update the entity status
    const isFinal = currentStep >= totalSteps || body.action === "reject";
    if (isFinal) {
      const newStatus = body.action === "approve" ? "APPROVED" : "REJECTED";
      
      // Update entity status based on type
      try {
        if (entity_type === "EXPENSE") {
          await prisma.expense.update({ where: { id: entity_id }, data: { status: newStatus } });
        } else if (entity_type === "PO") {
          await prisma.purchaseOrder.update({ where: { id: entity_id }, data: { status: newStatus } });
        } else if (entity_type === "LEAVE") {
          await prisma.leave.update({
            where: { id: entity_id },
            data: { status: newStatus, approved_by: user.sub, approved_at: new Date() }
          });
        } else if (entity_type === "MATERIAL_REQUEST") {
          await prisma.materialRequest.update({ where: { id: entity_id }, data: { status: newStatus, approved_by: user.sub } });
        }
      } catch (err) {
        console.error(`Failed to update ${entity_type} status:`, err);
      }
    }

    return ok({ log, isFinal, currentStep, totalSteps });
  }

  return badRequest("Invalid action. Use 'create_chain', 'approve', or 'reject'");
});
