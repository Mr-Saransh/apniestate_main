import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { UpdateTaskSchema } from "@/modules/tasks/tasks.schema";
import { updateTask, deleteTask } from "@/modules/tasks/tasks.service";
import { ok } from "@/lib/response";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = withAuth(async (req: NextRequest, user: any, context?: Ctx) => {
  const { id } = await context!.params;
  const parsed = await validateBody(req, UpdateTaskSchema);
  if ("error" in parsed) return parsed.error;

  const task = await updateTask(id, parsed.data, user.company_id);
  if (!task) return ok(null, "Task not found or access denied");
  return ok(task, "Task updated successfully");
});

export const DELETE = withAuth(async (_req: NextRequest, user: any, context?: Ctx) => {
  const { id } = await context!.params;
  const success = await deleteTask(id, user.company_id);
  if (!success) return ok(null, "Task not found or access denied");
  return ok(null, "Task deleted successfully");
});
