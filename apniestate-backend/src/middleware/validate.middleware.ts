import { ZodSchema } from "zod";
import { badRequest } from "@/lib/response";

export async function validateBody<T>(
  req: Request,
  schema: ZodSchema<T>
): Promise<{ data: T } | { error: Response }> {
  try {
    const body = await req.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      const firstError = Object.entries(fieldErrors)
        .map(([field, errs]) => `${field}: ${Array.isArray(errs) ? errs.join(', ') : errs}`)
        .join('; ');
      return {
        error: badRequest(firstError || "Validation failed", fieldErrors),
      };
    }
    return { data: result.data };
  } catch {
    return { error: badRequest("Invalid JSON body") };
  }
}
