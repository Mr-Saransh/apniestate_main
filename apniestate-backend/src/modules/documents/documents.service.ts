import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { CreateDocumentSchema, UpdateDocumentSchema } from "./documents.schema";

export async function getDocuments(
  userId: string,
  filters?: {
    category?: string;
    tag?: string;
    entity_type?: string;
    entity_id?: string;
    q?: string;
  }
) {
  const where: any = {};

  if (filters?.category) {
    where.category = filters.category;
  }
  if (filters?.entity_type) {
    where.entity_type = filters.entity_type;
  }
  if (filters?.entity_id) {
    where.entity_id = filters.entity_id;
  }
  if (filters?.tag) {
    where.tags = {
      some: {
        tag: {
          equals: filters.tag,
          mode: "insensitive",
        },
      },
    };
  }
  if (filters?.q) {
    where.OR = [
      { name: { contains: filters.q, mode: "insensitive" } },
      { category: { contains: filters.q, mode: "insensitive" } },
      {
        tags: {
          some: {
            tag: { contains: filters.q, mode: "insensitive" },
          },
        },
      },
    ];
  }

  return prisma.document.findMany({
    where,
    include: {
      uploader: { select: { name: true, role: true } },
      tags: true,
      versions: {
        orderBy: { version: "desc" },
      },
    },
    orderBy: { created_at: "desc" },
  });
}

export async function getDocumentById(id: string) {
  return prisma.document.findUnique({
    where: { id },
    include: {
      uploader: { select: { name: true, role: true } },
      tags: true,
      versions: {
        orderBy: { version: "desc" },
      },
    },
  });
}

export async function createDocument(data: any, userId: string) {
  const { tags, ...rest } = data;

  return prisma.$transaction(async (tx) => {
    const doc = await tx.document.create({
      data: {
        ...rest,
        uploaded_by: userId,
        versions: {
          create: {
            version: 1,
            file_url: rest.file_url,
            notes: "Initial version",
          },
        },
      },
      include: {
        uploader: { select: { name: true, role: true } },
        versions: true,
      },
    });

    if (tags && Array.isArray(tags) && tags.length > 0) {
      await tx.documentTag.createMany({
        data: tags.map((t: string) => ({
          document_id: doc.id,
          tag: t.trim(),
        })),
      });
    }

    return tx.document.findUnique({
      where: { id: doc.id },
      include: {
        uploader: { select: { name: true, role: true } },
        tags: true,
        versions: {
          orderBy: { version: "desc" },
        },
      },
    });
  });
}

export async function updateDocument(id: string, data: any) {
  const { tags, ...rest } = data;

  return prisma.$transaction(async (tx) => {
    const doc = await tx.document.update({
      where: { id },
      data: rest,
      include: {
        uploader: { select: { name: true, role: true } },
      },
    });

    if (tags && Array.isArray(tags)) {
      // Delete old tags
      await tx.documentTag.deleteMany({
        where: { document_id: id },
      });

      if (tags.length > 0) {
        // Create new tags
        await tx.documentTag.createMany({
          data: tags.map((t: string) => ({
            document_id: id,
            tag: t.trim(),
          })),
        });
      }
    }

    return tx.document.findUnique({
      where: { id },
      include: {
        uploader: { select: { name: true, role: true } },
        tags: true,
        versions: {
          orderBy: { version: "desc" },
        },
      },
    });
  });
}

export async function deleteDocument(id: string) {
  return prisma.document.delete({ where: { id } });
}

export async function addDocumentVersion(
  documentId: string,
  data: { file_url: string; notes?: string | null }
) {
  return prisma.$transaction(async (tx) => {
    // Get current highest version
    const latestVersion = await tx.documentVersion.findFirst({
      where: { document_id: documentId },
      orderBy: { version: "desc" },
    });

    const nextVerNum = latestVersion ? latestVersion.version + 1 : 1;

    // Create new version record
    const newVer = await tx.documentVersion.create({
      data: {
        document_id: documentId,
        version: nextVerNum,
        file_url: data.file_url,
        notes: data.notes || `Version ${nextVerNum}`,
      },
    });

    // Update parent document with the latest file_url
    await tx.document.update({
      where: { id: documentId },
      data: {
        file_url: data.file_url,
      },
    });

    return newVer;
  });
}

export async function getDocumentVersions(documentId: string) {
  return prisma.documentVersion.findMany({
    where: { document_id: documentId },
    orderBy: { version: "desc" },
  });
}

