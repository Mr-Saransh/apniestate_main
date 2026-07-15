import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { CompleteProfileSchema } from "@/modules/subscription/subscription.schema";
import { completeProfile } from "@/modules/subscription/subscription.service";
import { ok, badRequest } from "@/lib/response";

export const POST = withAuth(async (req: NextRequest, user) => {
  const parsed = await validateBody(req, CompleteProfileSchema);
  if ("error" in parsed) return parsed.error;

  try {
    const updatedUser = await completeProfile(user.sub, parsed.data);
    return ok(updatedUser, "Profile completed successfully");
  } catch (err: any) {
    return badRequest(err.message || "Failed to complete profile");
  }
});
