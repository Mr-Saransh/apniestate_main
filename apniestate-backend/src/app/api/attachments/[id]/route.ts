// @ts-nocheck
import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok, notFound } from "@/lib/response";

// DELETE /api/attachments/[id]
export const DELETE = withAuth(async (req: NextRequest, user, { params }: { params: { id: string } }) => {
  const { id } = await params;

  const attachment = await prisma.attachment.findUnique({ where: { id } });
  if (!attachment) {
    return notFound("Attachment not found");
  }

  await prisma.attachment.delete({ where: { id } });

  // Log deletion
  const dbUser = await prisma.user.findUnique({ where: { id: user.sub } });
  await prisma.activityLog.create({
    data: {
      user_id: user.sub,
      entity_type: "ATTACHMENT",
      entity_id: id,
      action: "DELETED",
      metadata: { file_name: attachment.file_name },
      company_id: dbUser?.company_id || null
    }
  });

  return ok({ deleted: true });
});
