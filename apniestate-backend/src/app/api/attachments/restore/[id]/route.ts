// @ts-nocheck
import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok, notFound } from "@/lib/response";

// PATCH /api/attachments/restore/[id]
export const PATCH = withAuth(async (req: NextRequest, user, { params }: { params: { id: string } }) => {
  const { id } = await params;

  const attachment = await prisma.attachment.findUnique({ where: { id } });
  
  if (!attachment) {
    return notFound("Attachment not found");
  }

  const restoredAttachment = await prisma.attachment.update({
    where: { id },
    data: { deleted_at: null }
  });

  // Log restoration
  const dbUser = await prisma.user.findUnique({ where: { id: user.sub } });
  await prisma.activityLog.create({
    data: {
      user_id: user.sub,
      entity_type: "ATTACHMENT",
      entity_id: id,
      action: "RESTORED",
      metadata: { file_name: attachment.file_name },
      company_id: dbUser?.company_id || null
    }
  });

  return ok(restoredAttachment);
});
