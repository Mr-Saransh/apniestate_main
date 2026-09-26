// @ts-nocheck
import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok, badRequest, notFound } from "@/lib/response";

async function getParamId(req: NextRequest, context: any): Promise<string | null> {
  if (context?.params) {
    const p = typeof context.params.then === "function" ? await context.params : context.params;
    if (p?.id) return p.id;
  }
  const parts = (req.nextUrl?.pathname || req.url || "").split("/");
  const candidate = parts[parts.length - 1]?.split("?")[0];
  return candidate || null;
}

/**
 * PATCH /api/project-intelligence/suggestions/[id]
 * Edit a suggestion (name, dates, etc.)
 * 
 * DELETE /api/project-intelligence/suggestions/[id]
 * Remove a suggestion (deletes or marks as REMOVED)
 */
export const PATCH = withAuth(async (req: NextRequest, user, context) => {
  try {
    const id = await getParamId(req, context);
    if (!id) return badRequest("Suggestion ID is required");

    const existing = await prisma.intelligenceSuggestion.findUnique({ where: { id } });
    if (!existing) return notFound("Suggestion");
    if (existing.status !== "SUGGESTED") return badRequest("Can only edit suggestions with SUGGESTED status");

    const body = await req.json();
    const updateData: any = {};

    if (body.name) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.suggested_start) updateData.suggested_start = new Date(body.suggested_start);
    if (body.suggested_end) updateData.suggested_end = new Date(body.suggested_end);
    if (body.duration_days !== undefined) updateData.duration_days = body.duration_days;
    if (body.reason !== undefined) updateData.reason = body.reason;

    // Recalculate duration if both dates provided
    if (updateData.suggested_start && updateData.suggested_end) {
      updateData.duration_days = Math.ceil(
        (updateData.suggested_end.getTime() - updateData.suggested_start.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    const updated = await prisma.intelligenceSuggestion.update({
      where: { id },
      data: updateData,
    });

    return ok(updated, "Suggestion updated");
  } catch (error: any) {
    console.error("Update suggestion error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

export const DELETE = withAuth(async (req: NextRequest, user, context) => {
  try {
    const id = await getParamId(req, context);
    if (!id) return badRequest("Suggestion ID is required");

    const existing = await prisma.intelligenceSuggestion.findUnique({ where: { id } });
    if (!existing) return notFound("Suggestion");

    try {
      await prisma.intelligenceSuggestion.delete({
        where: { id },
      });
    } catch {
      await prisma.intelligenceSuggestion.update({
        where: { id },
        data: { status: "REMOVED" },
      });
    }

    return ok(null, "Suggestion removed");
  } catch (error: any) {
    console.error("Delete suggestion error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

