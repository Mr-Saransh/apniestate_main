// @ts-nocheck
import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok, created, badRequest } from "@/lib/response";

// GET /api/attachments?entity_type=EXPENSE&entity_id=xxx
export const GET = withAuth(async (req: NextRequest, user) => {
  const { searchParams } = new URL(req.url);
  const entityType = searchParams.get("entity_type");
  const entityId = searchParams.get("entity_id");

  if (!entityType || !entityId) {
    return badRequest("entity_type and entity_id are required");
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.sub } });
  
  const attachments = await prisma.attachment.findMany({
    where: {
      entity_type: entityType,
      entity_id: entityId,
      company_id: dbUser?.company_id || undefined
    },
    orderBy: { created_at: "desc" }
  });

  return ok(attachments);
});

// POST /api/attachments
export const POST = withAuth(async (req: NextRequest, user) => {
  const body = await req.json();
  const { entity_type, entity_id, file_name, file_url, file_type, file_size } = body;

  if (!entity_type || !entity_id || !file_name || !file_url) {
    return badRequest("entity_type, entity_id, file_name, and file_url are required");
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.sub } });

  const attachment = await prisma.attachment.create({
    data: {
      entity_type,
      entity_id,
      file_name,
      file_url,
      file_type: file_type || "application/octet-stream",
      file_size: file_size || null,
      uploaded_by: user.sub,
      company_id: dbUser?.company_id || null
    }
  });

  // Log the activity
  await prisma.activityLog.create({
    data: {
      user_id: user.sub,
      entity_type: "ATTACHMENT",
      entity_id: attachment.id,
      action: "UPLOADED",
      metadata: { file_name, parent_entity_type: entity_type, parent_entity_id: entity_id },
      company_id: dbUser?.company_id || null
    }
  });

  return created(attachment);
});
