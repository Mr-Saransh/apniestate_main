import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { ok } from "@/lib/response";
import { getMyInvitations } from "@/modules/invitations/invitations.service";

export const GET = withAuth(async (req, user) => {
  const invitations = await getMyInvitations(user.email);
  return ok(invitations);
});
