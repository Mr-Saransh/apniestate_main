import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { CreateDocumentSchema, UpdateDocumentSchema } from "./documents.schema";

export async function getDocuments(userId: string) {
  return prisma.document.findMany({
    include: {
      uploader: { select: { name: true, role: true } }
    },
    orderBy: { created_at: "desc" }
  });
}

export async function getDocumentById(id: string) {
  return prisma.document.findUnique({
    where: { id },
    include: {
      uploader: { select: { name: true, role: true } }
    }
  });
}

export async function createDocument(data: any, userId: string) {
  return prisma.document.create({
    data: {
      ...data,
      uploaded_by: userId
    },
    include: {
      uploader: { select: { name: true, role: true } }
    }
  });
}

export async function updateDocument(id: string, data: any) {
  return prisma.document.update({
    where: { id },
    data,
    include: {
      uploader: { select: { name: true, role: true } }
    }
  });
}

export async function deleteDocument(id: string) {
  return prisma.document.delete({ where: { id } });
}
