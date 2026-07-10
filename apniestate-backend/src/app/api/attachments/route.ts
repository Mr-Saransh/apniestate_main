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
  const category = searchParams.get("category");

  if (!entityType || !entityId) {
    return badRequest("entity_type and entity_id are required");
  }

  if (entityId.startsWith('demo-dpr-')) {
    return ok([
      {
        id: `att-${entityId}-1`,
        entity_type: 'DPR',
        entity_id: entityId,
        category: 'Progress Photo',
        file_name: 'demo-photo.jpg',
        original_name: 'demo-photo.jpg',
        mime_type: 'image/jpeg',
        secure_url: entityId === 'demo-dpr-1' ? 'https://images.unsplash.com/photo-1541888081622-4a00bc9738c6?auto=format&fit=crop&w=800&q=80' : 
                   entityId === 'demo-dpr-2' ? 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80' : 
                   'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80',
        created_at: new Date().toISOString()
      },
      {
        id: `att-${entityId}-2`,
        entity_type: 'DPR',
        entity_id: entityId,
        category: 'Progress Photo',
        file_name: 'demo-photo-2.jpg',
        original_name: 'demo-photo-2.jpg',
        mime_type: 'image/jpeg',
        secure_url: entityId === 'demo-dpr-1' ? 'https://images.unsplash.com/photo-1504307651254-35680f356f12?auto=format&fit=crop&w=800&q=80' : 
                   entityId === 'demo-dpr-2' ? 'https://images.unsplash.com/photo-1531834685032-c34bf0f84c77?auto=format&fit=crop&w=800&q=80' : 
                   'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
        created_at: new Date().toISOString()
      }
    ]);
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.sub } });
  
  const attachments = await prisma.attachment.findMany({
    where: {
      entity_type: entityType,
      entity_id: entityId,
      company_id: dbUser?.company_id || undefined,
      deleted_at: null,
      ...(category ? { category } : {})
    },
    orderBy: { created_at: "desc" }
  });

  let legacyAttachments: any[] = [];
  if (entityType === 'DPR') {
    try {
      const dpr = await prisma.dailyReport.findUnique({
        where: { id: entityId },
        select: { photos: true }
      });
      
      if (dpr && dpr.photos) {
        let photosArr = [];
        if (typeof dpr.photos === 'string') {
          photosArr = JSON.parse(dpr.photos);
        } else if (Array.isArray(dpr.photos)) {
          photosArr = dpr.photos;
        } else if (typeof dpr.photos === 'object') {
          photosArr = (dpr.photos as any)?.urls || [];
        }
        
        if (Array.isArray(photosArr)) {
          legacyAttachments = photosArr.map((url: any, idx: number) => {
            const finalUrl = typeof url === 'string' ? url : url?.url;
            return {
              id: `legacy-att-${entityId}-${idx}`,
              entity_type: 'DPR',
              entity_id: entityId,
              category: 'Progress Photo',
              file_name: `legacy-photo-${idx + 1}.jpg`,
              original_name: `legacy-photo-${idx + 1}.jpg`,
              mime_type: 'image/jpeg',
              secure_url: finalUrl || 'https://images.unsplash.com/photo-1541888081622-4a00bc9738c6?auto=format&fit=crop&w=800&q=80',
              created_at: new Date().toISOString()
            };
          }).filter(a => a.secure_url);
        }
      }
    } catch (e) {
      console.error("Failed to parse legacy DPR photos", e);
    }
  }

  return ok([...legacyAttachments, ...attachments]);
});

// POST /api/attachments
export const POST = withAuth(async (req: NextRequest, user) => {
  const body = await req.json();
  const {
    entity_type,
    entity_id,
    category,
    file_name,
    original_name,
    mime_type,
    file_size,
    image_width,
    image_height,
    cloudinary_public_id,
    secure_url,
    thumbnail_url
  } = body;

  if (!entity_type || !entity_id || !file_name || !secure_url || !mime_type) {
    return badRequest("entity_type, entity_id, file_name, secure_url and mime_type are required");
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.sub } });

  const attachment = await prisma.attachment.create({
    data: {
      entity_type,
      entity_id,
      category,
      file_name,
      original_name,
      mime_type,
      file_size,
      image_width,
      image_height,
      cloudinary_public_id,
      secure_url,
      thumbnail_url,
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
      metadata: { file_name, parent_entity_type: entity_type, parent_entity_id: entity_id, category },
      company_id: dbUser?.company_id || null
    }
  });

  return created(attachment);
});
