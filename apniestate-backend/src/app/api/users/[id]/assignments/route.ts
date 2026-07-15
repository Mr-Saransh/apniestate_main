import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { assignProjectsToUser } from "@/modules/users/users.service";
import { ok, badRequest, notFound } from "@/lib/response";
import { z } from "zod";

const AssignProjectsSchema = z.object({
  project_ids: z.array(z.string()),
});

export const PUT = withAuth(async (req: NextRequest, user, { params }) => {
  if (user.role !== "BUILDER" && user.role !== "ADMIN") {
    return badRequest("Only builders and admins can assign projects");
  }

  const { id } = await params;
  if (!id) return badRequest("User ID is required");

  let body;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const parsed = AssignProjectsSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0].message);
  }

  if (!user.company_id) {
    return badRequest("No active workspace");
  }

  const result = await assignProjectsToUser(id, parsed.data.project_ids, user.sub, user.company_id);
  if (!result) return notFound("User not found");

  return ok({ success: true }, "User assignments updated");
});
