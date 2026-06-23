import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { getVendorRatings, addVendorRating } from "@/modules/vendors/vendors.service";
import { ok, created } from "@/lib/response";
import { z } from "zod";
import { validateBody } from "@/middleware/validate.middleware";

const CreateRatingSchema = z.object({
  score: z.number().int().min(1).max(5),
  comment: z.string().optional().nullable(),
});

type Ctx = { params: Promise<{ id: string }> };

export const GET = withAuth(async (_req: NextRequest, _user, ctx?: Ctx) => {
  const { id } = await ctx!.params;
  const ratings = await getVendorRatings(id);
  return ok(ratings);
});

export const POST = withAuth(async (req: NextRequest, user, ctx?: Ctx) => {
  const { id } = await ctx!.params;
  const parsed = await validateBody(req, CreateRatingSchema);
  if ("error" in parsed) return parsed.error;
  
  const rating = await addVendorRating(id, user.sub, parsed.data.score, parsed.data.comment ?? undefined);
  return created(rating, "Rating added");
});
