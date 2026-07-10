// @ts-nocheck
import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok, notFound } from "@/lib/response";

// GET /api/attachments/[id]
export const GET = withAuth(async (req: NextRequest, user, { params }: { params: { id: string } }) => {
  const { id } = await params;
  
  const attachment = await prisma.attachment.findUnique({
    where: { id, deleted_at: null }
  });

  if (!attachment) {
    return notFound("Attachment not found");
  }

  return ok(attachment);
});

// PATCH /api/attachments/[id]
export const PATCH = withAuth(async (req: NextRequest, user, { params }: { params: { id: string } }) => {
  const { id } = await params;
  const body = await req.json();

  const attachment = await prisma.attachment.findUnique({
    where: { id, deleted_at: null }
  });

  if (!attachment) {
    return notFound("Attachment not found");
  }

  const updatedAttachment = await prisma.attachment.update({
    where: { id },
    data: {
      category: body.category !== undefined ? body.category : attachment.category,
      file_name: body.file_name !== undefined ? body.file_name : attachment.file_name,
    }
  });

  return ok(updatedAttachment);
});

// DELETE /api/attachments/[id]
export const DELETE = withAuth(async (req: NextRequest, user, { params }: { params: { id: string } }) => {
  const { id } = await params;

  const attachment = await prisma.attachment.findUnique({ where: { id } });
  if (!attachment) {
    return notFound("Attachment not found");
  }

  await prisma.attachment.update({
    where: { id },
    data: { deleted_at: new Date() }
  });

  // Log deletion
  const dbUser = await prisma.user.findUnique({ where: { id: user.sub } });
  await prisma.activityLog.create({
    data: {
      user_id: user.sub,
      entity_type: "ATTACHMENT",
      entity_id: id,
      action: "DELETED",
      metadata: { file_name: attachment.file_name, soft_delete: true },
      company_id: dbUser?.company_id || null
    }
  });

  return ok({ deleted: true });
});
