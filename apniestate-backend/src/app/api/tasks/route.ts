import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { CreateTaskSchema } from "@/modules/tasks/tasks.schema";
import { getTasks, createTask } from "@/modules/tasks/tasks.service";
import { ok, created } from "@/lib/response";

export const GET = withAuth(async (req, user) => {
  const url = new URL(req.url);
  const filters = {
    project_id: url.searchParams.get("project_id") || undefined,
    site_id: url.searchParams.get("site_id") || undefined,
    assignee_id: url.searchParams.get("assignee_id") || undefined,
    status: url.searchParams.get("status") || undefined,
  };
  const tasks = await getTasks(user.sub, user.role, filters, user.company_id);
  return ok(tasks);
});

export const POST = withAuth(async (req, user) => {
  const parsed = await validateBody(req, CreateTaskSchema);
  if ("error" in parsed) return parsed.error;

  const task = await createTask(parsed.data, user.sub, user.company_id);
  return created(task, "Task created successfully");
});
