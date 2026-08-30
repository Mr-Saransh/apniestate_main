import { prisma } from "@/lib/prisma";
import { notifyUsers } from "@/modules/notifications/notifications.service";

export async function submitResignation(data: {
  user_id: string;
  company_id: string;
  reason: string;
  last_working_day?: string;
  feedback?: string;
}) {
  const existing = await prisma.resignation.findFirst({
    where: { user_id: data.user_id, company_id: data.company_id, status: "PENDING" }
  });
  if (existing) throw new Error("You already have a pending resignation request for this company");

  const resignation = await prisma.resignation.create({
    data: {
      user_id: data.user_id,
      company_id: data.company_id,
      reason: data.reason,
      last_working_day: data.last_working_day ? new Date(data.last_working_day) : null,
      feedback: data.feedback,
    }
  });

  // Notify builders
  const memberships = await prisma.companyMembership.findMany({
    where: { company_id: data.company_id, status: "ACTIVE" }
  });
  const builders = memberships.filter(b => b.roles.includes("BUILDER") || b.roles.includes("ADMIN"));
  const user = await prisma.user.findUnique({ where: { id: data.user_id } });
  
  if (builders.length > 0 && user) {
    await notifyUsers(
      builders.map(b => b.user_id),
      "New Resignation Request",
      `${user.name} has submitted a resignation request.`,
      { type: "warning" }
    );
  }

  return resignation;
}

export async function getCompanyResignations(companyId: string) {
  return prisma.resignation.findMany({
    where: { company_id: companyId },
    include: {
      user: { select: { name: true, email: true, role: true } },
      reviewer: { select: { name: true } }
    },
    orderBy: { created_at: "desc" }
  });
}

export async function getMyResignations(userId: string) {
  return prisma.resignation.findMany({
    where: { user_id: userId },
    include: {
      company: { select: { name: true } },
      reviewer: { select: { name: true } }
    },
    orderBy: { created_at: "desc" }
  });
}

export async function reviewResignation(id: string, companyId: string, reviewerId: string, status: "APPROVED" | "REJECTED") {
  const resignation = await prisma.resignation.findUnique({ where: { id } });
  if (!resignation || resignation.company_id !== companyId) throw new Error("Not found");
  if (resignation.status !== "PENDING") throw new Error("Already reviewed");

  await prisma.resignation.update({
    where: { id },
    data: { status, reviewed_by: reviewerId, reviewed_at: new Date() }
  });

  if (status === "APPROVED") {
    // 1. Deactivate membership
    await prisma.companyMembership.update({
      where: { user_id_company_id: { user_id: resignation.user_id, company_id: companyId } },
      data: { status: "RESIGNED" }
    });

    // 2. Remove all project and site assignments for this company
    await prisma.projectAssignment.deleteMany({
      where: { user_id: resignation.user_id, company_id: companyId }
    });
    
    await prisma.siteAssignment.deleteMany({
      where: { user_id: resignation.user_id, company_id: companyId }
    });

    // 3. Clear last_workspace_id if it's the current one
    const user = await prisma.user.findUnique({ where: { id: resignation.user_id } });
    if (user && user.last_workspace_id === companyId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { last_workspace_id: null }
      });
    }

    // Notify user
    await notifyUsers([resignation.user_id], "Resignation Approved", "Your resignation request has been approved. Your access to the company is now revoked.", { type: "info" });
  } else {
    // Rejected
    await notifyUsers([resignation.user_id], "Resignation Rejected", "Your resignation request has been rejected. Please contact your Builder.", { type: "warning" });
  }

  return true;
}
