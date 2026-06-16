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
      return {
        error: badRequest("Validation failed", result.error.flatten().fieldErrors),
      };
    }
    return { data: result.data };
  } catch {
    return { error: badRequest("Invalid JSON body") };
  }
}
