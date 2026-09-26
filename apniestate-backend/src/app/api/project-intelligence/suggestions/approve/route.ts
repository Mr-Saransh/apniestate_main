// @ts-nocheck
import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok, badRequest, notFound, conflict } from "@/lib/response";

/**
 * POST /api/project-intelligence/suggestions/approve
 * 
 * Approve a single suggestion or all suggestions.
 * Creates official milestone(s) through the existing milestone system.
 * 
 * Body:
 *   { suggestion_id: string } — approve single
 *   { project_id: string, approve_all: true } — approve all
 */
export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const body = await req.json();

    // Approve single suggestion
    if (body.suggestion_id) {
      const suggestion = await prisma.intelligenceSuggestion.findUnique({
        where: { id: body.suggestion_id },
      });

      if (!suggestion) return notFound("Suggestion");
      if (suggestion.status !== "SUGGESTED") {
        return badRequest("Only SUGGESTED items can be approved");
      }

      // Check for duplicate official milestone
      const existingMilestone = await prisma.milestone.findFirst({
        where: {
          project_id: suggestion.project_id,
          name: suggestion.name,
        },
      });

      if (existingMilestone) {
        return conflict(
          `An official milestone named "${suggestion.name}" already exists. Please edit the suggestion name or remove it.`
        );
      }

      // Create official milestone using the same pattern as existing milestones
      const milestone = await prisma.milestone.create({
        data: {
          project_id: suggestion.project_id,
          name: suggestion.name,
          description: suggestion.description,
          target_date: suggestion.suggested_end || suggestion.suggested_start || new Date(),
          weight: 1,
          status: "PENDING",
          progress_percentage: 0,
        },
      });

      // Mark suggestion as approved
      await prisma.intelligenceSuggestion.update({
        where: { id: suggestion.id },
        data: {
          status: "APPROVED",
          approved_at: new Date(),
          approved_by: user.sub,
          milestone_id: milestone.id,
        },
      });

      // Recalculate project progress (same as existing milestone logic)
      await recalculateProjectProgress(suggestion.project_id);

      return ok({ suggestion: suggestion.id, milestone: milestone.id }, "Milestone approved and created");
    }

    // Approve all suggestions for a project
    if (body.project_id && body.approve_all) {
      const suggestions = await prisma.intelligenceSuggestion.findMany({
        where: { project_id: body.project_id, status: "SUGGESTED" },
        orderBy: { sort_order: "asc" },
      });

      if (suggestions.length === 0) {
        return badRequest("No pending suggestions to approve");
      }

      // Check for duplicate names
      const existingMilestones = await prisma.milestone.findMany({
        where: { project_id: body.project_id },
        select: { name: true },
      });
      const existingNames = new Set(existingMilestones.map((m) => m.name.toLowerCase()));

      const results: any[] = [];
      const skipped: string[] = [];

      for (const suggestion of suggestions) {
        if (existingNames.has(suggestion.name.toLowerCase())) {
          skipped.push(suggestion.name);
          continue;
        }

        const milestone = await prisma.milestone.create({
          data: {
            project_id: suggestion.project_id,
            name: suggestion.name,
            description: suggestion.description,
            target_date: suggestion.suggested_end || suggestion.suggested_start || new Date(),
            weight: 1,
            status: "PENDING",
            progress_percentage: 0,
          },
        });

        await prisma.intelligenceSuggestion.update({
          where: { id: suggestion.id },
          data: {
            status: "APPROVED",
            approved_at: new Date(),
            approved_by: user.sub,
            milestone_id: milestone.id,
          },
        });

        results.push({ suggestion: suggestion.id, milestone: milestone.id, name: suggestion.name });
      }

      await recalculateProjectProgress(body.project_id);

      return ok(
        { approved: results, skipped },
        `${results.length} milestone(s) approved.${skipped.length > 0 ? ` ${skipped.length} skipped (duplicate names).` : ""}`
      );
    }

    return badRequest("Provide suggestion_id or project_id with approve_all");
  } catch (error: any) {
    console.error("Approve suggestion error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function recalculateProjectProgress(projectId: string) {
  const milestones = await prisma.milestone.findMany({
    where: { project_id: projectId },
  });

  if (milestones.length === 0) return;

  const totalWeight = milestones.reduce((sum, m) => sum + (m.weight || 1), 0);
  const completedWeight = milestones
    .filter((m) => m.status === "COMPLETED")
    .reduce((sum, m) => sum + (m.weight || 1), 0);

  const progress = Math.round((completedWeight / totalWeight) * 100);

  await prisma.project.update({
    where: { id: projectId },
    data: { progress_percentage: progress },
  });
}
