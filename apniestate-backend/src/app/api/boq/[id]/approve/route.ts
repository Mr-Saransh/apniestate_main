import { withAuth } from "@/middleware/auth.middleware";
import { approveBOQ } from "@/modules/boq/boq.service";
import { ok } from "@/lib/response";

export const PATCH = withAuth(async (_req, user, context) => {
  const params = await context.params;
  const boq = await approveBOQ(params.id, user.sub);
  return ok(boq, "BOQ Approved and locked.");
});
