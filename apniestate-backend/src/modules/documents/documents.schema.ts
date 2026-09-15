import { z } from "zod";

export const CreateDocumentSchema = z.object({
  name: z.string().min(1, "Document name is required"),
  file_url: z.string().min(1, "File URL is required"),
  entity_type: z.string().min(1, "Entity type is required"),
  entity_id: z.string().min(1, "Entity ID is required"),
  category: z.string().optional().nullable(),
  file_size: z.number().int().optional().nullable(),
  tags: z.array(z.string()).optional(),
});

export const UpdateDocumentSchema = CreateDocumentSchema.partial();

export const CreateVersionSchema = z.object({
  file_url: z.string().min(1, "File URL is required"),
  notes: z.string().optional().nullable(),
});

