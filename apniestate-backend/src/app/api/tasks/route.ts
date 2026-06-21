import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { CreateTaskSchema } from "@/modules/tasks/tasks.schema";
import { getTasks, createTask } from "@/modules/tasks/tasks.service";
import { ok, created } from "@/lib/response";

export const GET = withAuth(async (_req, user) => {
  const tasks = await getTasks(user.sub);
  return ok(tasks);
});

export const POST = withAuth(async (req, user) => {
  const parsed = await validateBody(req, CreateTaskSchema);
  if ("error" in parsed) return parsed.error;

  const task = await createTask(parsed.data, user.sub);
  return created(task, "Task created successfully");
});
