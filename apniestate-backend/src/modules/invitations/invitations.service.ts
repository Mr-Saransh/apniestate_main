import { prisma } from "@/lib/prisma";
import type { Role } from "@/types";
import { notifyUsers } from "@/modules/notifications/notifications.service";
import { mailerService } from "@/modules/auth/mailer.service";

export async function createInvitation(data: {
  company_id: string;
  invited_by: string;
  email: string;
  role: Role;
  project_ids?: string[];
  site_ids?: string[];
}) {
  const emailLower = data.email.toLowerCase();
  const existing = await prisma.invitation.findFirst({
    where: { company_id: data.company_id, email: emailLower, status: { in: ["PENDING", "ACCEPTED"] } }
  });
  if (existing) throw new Error("An active invitation already exists for this email in this company");

  // Check if they are already a member
  const user = await prisma.user.findUnique({ where: { email: emailLower } });
  if (user) {
    const membership = await prisma.companyMembership.findUnique({
      where: { user_id_company_id: { user_id: user.id, company_id: data.company_id } }
    });
    if (membership && membership.status === "ACTIVE") {
      if (membership.roles.includes(data.role)) {
        throw new Error(`User is already an active ${data.role.replace(/_/g, " ")} in this company`);
      }
      // Add the new role to the existing company membership directly
      const updatedRoles = [...membership.roles, data.role];
      await prisma.companyMembership.update({
        where: { id: membership.id },
        data: { roles: updatedRoles }
      });
      const company = await prisma.company.findUnique({ where: { id: data.company_id } });
      await notifyUsers(
        [user.id],
        "New Role Assigned",
        `You have been assigned the ${data.role.replace(/_/g, " ")} role in ${company?.name || "the company"}.`,
        { type: "info" }
      );
      return {
        id: `role_added_${membership.id}`,
        company_id: data.company_id,
        invited_by: data.invited_by,
        email: emailLower,
        role: data.role,
        status: "ACCEPTED",
        created_at: new Date(),
        expires_at: new Date(),
      };
    }
  }

  const invitation = await prisma.invitation.create({
    data: {
      ...data,
      email: emailLower,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days default
    }
  });

  const company = await prisma.company.findUnique({ where: { id: data.company_id } });
  const inviter = await prisma.user.findUnique({ where: { id: data.invited_by }, select: { name: true, email: true } });

  // Send invitation email to new user
  mailerService.sendUserInvitationEmail({
    to: emailLower,
    role: data.role,
    companyName: company?.name || "Apniestate",
    inviterName: inviter?.name || inviter?.email || "Team Administrator",
    inviteLink: `${process.env.FRONTEND_URL || "https://build.apniestate.com"}/auth/register?email=${encodeURIComponent(emailLower)}`,
  }).catch((err) => console.error("Async user invitation email error:", err));

  if (user) {
    // Also notify the user in-app if they already have an account
    await notifyUsers(
      [user.id],
      "New Company Invitation",
      `You have been invited to join ${company?.name || "a company"} as a ${data.role}.`,
      { type: "info" }
    );
  }

  return invitation;
}

export async function getCompanyInvitations(companyId: string) {
  return prisma.invitation.findMany({
    where: { company_id: companyId },
    include: { inviter: { select: { name: true, email: true } } },
    orderBy: { created_at: "desc" }
  });
}

export async function getMyInvitations(email: string) {
  return prisma.invitation.findMany({
    where: { email: email.toLowerCase() },
    include: {
      company: { select: { name: true } },
      inviter: { select: { name: true, email: true } }
    },
    orderBy: { created_at: "desc" }
  });
}

export async function acceptInvitation(invitationId: string, userId: string, userEmail: string) {
  const invitation = await prisma.invitation.findUnique({ where: { id: invitationId } });
  if (!invitation) throw new Error("Invitation not found");
  if (invitation.email.toLowerCase() !== userEmail.toLowerCase()) throw new Error("Unauthorized to accept this invitation");
  if (invitation.status !== "PENDING") throw new Error(`Cannot accept invitation with status: ${invitation.status}`);
  if (invitation.expires_at < new Date()) {
    await prisma.invitation.update({ where: { id: invitationId }, data: { status: "EXPIRED" } });
    throw new Error("Invitation has expired");
  }

  // Update invitation
  await prisma.invitation.update({
    where: { id: invitationId },
    data: { status: "ACCEPTED", accepted_at: new Date() }
  });

  // Create membership if it doesn't exist, or update if INACTIVE
  const membership = await prisma.companyMembership.findUnique({
    where: { user_id_company_id: { user_id: userId, company_id: invitation.company_id } }
  });

  if (!membership) {
    await prisma.companyMembership.create({
      data: {
        user_id: userId,
        company_id: invitation.company_id,
        roles: [invitation.role],
        status: "ACTIVE"
      }
    });
  } else {
    // Add role if not present, set ACTIVE
    const newRoles = [...new Set([...membership.roles, invitation.role])];
    await prisma.companyMembership.update({
      where: { id: membership.id },
      data: { roles: newRoles, status: "ACTIVE" }
    });
  }

  // Handle project/site assignments
  if (invitation.project_ids && invitation.project_ids.length > 0) {
    for (const projectId of invitation.project_ids) {
      await prisma.projectAssignment.upsert({
        where: { user_id_project_id_role: { user_id: userId, project_id: projectId, role: invitation.role } },
        create: { user_id: userId, project_id: projectId, company_id: invitation.company_id, role: invitation.role, assigned_by: invitation.invited_by },
        update: {}
      });
    }
  }

  if (invitation.site_ids && invitation.site_ids.length > 0) {
    for (const siteId of invitation.site_ids) {
      await prisma.siteAssignment.upsert({
        where: { user_id_site_id_role: { user_id: userId, site_id: siteId, role: invitation.role } },
        create: { user_id: userId, site_id: siteId, company_id: invitation.company_id, role: invitation.role, assigned_by: invitation.invited_by },
        update: {}
      });
    }
  }

  // Notify inviter
  const user = await prisma.user.findUnique({ where: { id: userId } });
  await notifyUsers(
    [invitation.invited_by],
    "Invitation Accepted",
    `${user?.name} accepted your invitation.`,
    { type: "success" }
  );

  return true;
}

export async function rejectInvitation(invitationId: string, userEmail: string) {
  const invitation = await prisma.invitation.findUnique({ where: { id: invitationId } });
  if (!invitation) throw new Error("Invitation not found");
  if (invitation.email.toLowerCase() !== userEmail.toLowerCase()) throw new Error("Unauthorized");
  if (invitation.status !== "PENDING") throw new Error("Cannot reject");

  await prisma.invitation.update({
    where: { id: invitationId },
    data: { status: "REJECTED" }
  });

  // Notify inviter
  await notifyUsers(
    [invitation.invited_by],
    "Invitation Rejected",
    `${userEmail} rejected your invitation.`,
    { type: "danger" }
  );
  return true;
}

export async function approveInvitation(invitationId: string, companyId: string) {
  const invitation = await prisma.invitation.findUnique({ where: { id: invitationId } });
  if (!invitation || invitation.company_id !== companyId) throw new Error("Not found");
  
  await prisma.invitation.update({
    where: { id: invitationId },
    data: { status: "APPROVED", approved_at: new Date() }
  });
  return true;
}

export async function cancelInvitation(invitationId: string, companyId: string) {
  const invitation = await prisma.invitation.findUnique({ where: { id: invitationId } });
  if (!invitation || invitation.company_id !== companyId) throw new Error("Not found");
  
  await prisma.invitation.update({
    where: { id: invitationId },
    data: { status: "CANCELLED" }
  });
  return true;
}

export async function resendInvitation(invitationId: string, companyId: string) {
  const invitation = await prisma.invitation.findUnique({ where: { id: invitationId } });
  if (!invitation || invitation.company_id !== companyId) throw new Error("Not found");
  
  await prisma.invitation.update({
    where: { id: invitationId },
    data: { status: "PENDING", expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
  });
  
  // Re-send invitation email
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  const inviter = await prisma.user.findUnique({ where: { id: invitation.invited_by }, select: { name: true, email: true } });

  mailerService.sendUserInvitationEmail({
    to: invitation.email.toLowerCase(),
    role: invitation.role,
    companyName: company?.name || "Apniestate",
    inviterName: inviter?.name || inviter?.email || "Team Administrator",
    inviteLink: `${process.env.FRONTEND_URL || "https://build.apniestate.com"}/auth/register?email=${encodeURIComponent(invitation.email)}`,
  }).catch((err) => console.error("Async user re-invitation email error:", err));

  // Re-notify user in-app if registered
  const user = await prisma.user.findUnique({ where: { email: invitation.email } });
  if (user) {
    await notifyUsers(
      [user.id],
      "Company Invitation Reminder",
      `Reminder: You have a pending invitation to join ${company?.name}.`,
      { type: "info" }
    );
  }
  
  return true;
}
