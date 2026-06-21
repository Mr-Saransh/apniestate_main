import { z } from "zod";

export const CreateDocumentSchema = z.object({
  name: z.string().min(1, "Document name is required"),
  file_url: z.string().url("Invalid file URL"),
  entity_type: z.string().min(1, "Entity type is required"),
  entity_id: z.string().min(1, "Entity ID is required"),
  category: z.string().optional().nullable(),
  file_size: z.number().int().optional().nullable(),
});

export const UpdateDocumentSchema = CreateDocumentSchema.partial();
