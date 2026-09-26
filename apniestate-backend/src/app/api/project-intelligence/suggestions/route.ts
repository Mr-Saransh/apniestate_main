// @ts-nocheck
import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok, created, badRequest } from "@/lib/response";

/**
 * GET /api/project-intelligence/suggestions?project_id=xxx
 * Returns all suggestions for a project
 * 
 * POST /api/project-intelligence/suggestions
 * Generate or create suggestions
 */
export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const url = new URL(req.url);
    const projectId = url.searchParams.get("project_id");

    if (!projectId) {
      return badRequest("project_id is required");
    }

    const suggestions = await prisma.intelligenceSuggestion.findMany({
      where: { project_id: projectId, status: "SUGGESTED" },
      orderBy: { sort_order: "asc" },
    });

    return ok(suggestions);
  } catch (error: any) {
    console.error("Fetch suggestions error:", error);
    return ok([]);
  }
});

/**
 * DELETE /api/project-intelligence/suggestions?project_id=xxx
 * Cancel the generated plan by removing all pending suggestions
 */
export const DELETE = withAuth(async (req: NextRequest, user) => {
  try {
    const url = new URL(req.url);
    const projectId = url.searchParams.get("project_id");

    if (!projectId) {
      return badRequest("project_id is required");
    }

    await prisma.intelligenceSuggestion.deleteMany({
      where: { project_id: projectId, status: "SUGGESTED" },
    });

    return ok(null, "Generated plan cancelled");
  } catch (error: any) {
    console.error("Cancel plan error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const body = await req.json();
    const { project_id, action } = body;

    if (!project_id) {
      return badRequest("project_id is required");
    }

    // Check if the project exists
    const project = await prisma.project.findUnique({
      where: { id: project_id },
    });

    if (!project) {
      return badRequest("Project not found");
    }

    // Action: cancel / clear — cancel the generated plan
    if (action === "cancel" || action === "clear") {
      await prisma.intelligenceSuggestion.deleteMany({
        where: { project_id, status: "SUGGESTED" },
      });
      return ok(null, "Generated project plan cancelled");
    }

    // Action: generate — auto-generate milestone suggestions based on area, floors, BHK and realistic dates
    if (action === "generate") {
      // Clear any existing pending suggestions so user can regenerate freely
      await prisma.intelligenceSuggestion.deleteMany({
        where: { project_id, status: "SUGGESTED" },
      });

      // ─── 1. DETERMINISTIC TODAY-FIRST START DATE ────────────
      // Ensure we NEVER pick dates in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let effectiveStart = new Date(today);
      if (body.startDate) {
        const customDate = new Date(body.startDate);
        customDate.setHours(0, 0, 0, 0);
        if (!isNaN(customDate.getTime()) && customDate >= today) {
          effectiveStart = customDate;
        }
      } else if (project.start_date) {
        const projDate = new Date(project.start_date);
        projDate.setHours(0, 0, 0, 0);
        if (projDate >= today) {
          effectiveStart = projDate;
        }
      }

      // ─── 2. PARAMETERS (AREA, FLOORS, BHK, PACE) ───────────
      const rawArea = Number(body.builtUpArea || body.area) || 2000;
      const areaSqFt = Math.max(400, Math.min(100000, rawArea));

      let floorsCount = 2; // default G+1
      if (typeof body.floors === 'number') {
        floorsCount = Math.max(1, Math.min(20, body.floors));
      } else if (typeof body.floors === 'string') {
        const match = body.floors.match(/\d+/);
        floorsCount = match ? Math.max(1, Math.min(20, parseInt(match[0], 10))) : 2;
        if (body.floors.toLowerCase().includes('ground') && !body.floors.toLowerCase().includes('+')) {
          floorsCount = 1;
        }
      }

      let bhkCount = 3;
      if (typeof body.bhk === 'number') {
        bhkCount = Math.max(1, Math.min(10, body.bhk));
      } else if (typeof body.bhk === 'string') {
        const match = body.bhk.match(/\d+/);
        bhkCount = match ? Math.max(1, Math.min(10, parseInt(match[0], 10))) : 3;
      }

      const paceMultiplier = body.constructionPace === 'FAST' ? 0.85 : (body.constructionPace === 'RELAXED' ? 1.2 : 1.0);

      const footprint = Math.round(areaSqFt / floorsCount);
      const floorLabel = floorsCount === 1 ? 'Ground floor' : `G+${floorsCount - 1} (${floorsCount} levels)`;

      // ─── 3. CIVIL ENGINEERING PHASING CALCULATION ──────────
      // Realistic duration calculations based on Indian construction standards (IS Codes)
      const dFoundation = Math.round(Math.max(15, 18 + (footprint / 250)) * paceMultiplier);
      const dStructure = Math.round(Math.max(20, 10 + (floorsCount * 22)) * paceMultiplier);
      const dBrickwork = Math.round(Math.max(14, 12 + (floorsCount * 12) + (bhkCount * 3)) * paceMultiplier);
      const dMep = Math.round(Math.max(12, 10 + (floorsCount * 8) + (bhkCount * 4)) * paceMultiplier);
      const dPlastering = Math.round(Math.max(14, 12 + (floorsCount * 10) + (areaSqFt / 400)) * paceMultiplier);
      const dFlooring = Math.round(Math.max(14, 14 + (areaSqFt / 200) + (bhkCount * 2)) * paceMultiplier);
      const dFinishes = Math.round(Math.max(14, 12 + (floorsCount * 7) + (areaSqFt / 300)) * paceMultiplier);
      const dHandover = Math.round(14 * paceMultiplier);

      // Overlapping offsets from project start
      // Phase 1 starts on day 0
      const startFoundation = 0;
      const endFoundation = startFoundation + dFoundation;

      // Phase 2 (Structure) begins as foundation curing/plinth finishes
      const startStructure = Math.max(startFoundation + 10, endFoundation - 4);
      const endStructure = startStructure + dStructure;

      // Phase 3 (Masonry) begins after ground slab is cast
      const startBrickwork = Math.min(endStructure - 5, startStructure + Math.min(22, Math.round(dStructure * 0.4)));
      const endBrickwork = startBrickwork + dBrickwork;

      // Phase 4 (MEP Concealed) begins once masonry walls are erected
      const startMep = startBrickwork + Math.round(dBrickwork * 0.35);
      const endMep = startMep + dMep;

      // Phase 5 (Plastering) begins after MEP chasers & piping inspection
      const startPlastering = Math.max(startMep + 8, Math.round(endBrickwork * 0.8));
      const endPlastering = startPlastering + dPlastering;

      // Phase 6 (Flooring & Tiling) begins after plaster cured & waterproofing
      const startFlooring = Math.max(startPlastering + 10, endPlastering - 5);
      const endFlooring = startFlooring + dFlooring;

      // Phase 7 (Painting, Doors & Electrical fittings) begins after flooring laid
      const startFinishes = Math.max(startFlooring + 10, endFlooring - 4);
      const endFinishes = startFinishes + dFinishes;

      // Phase 8 (Handover & External Paving)
      const startHandover = Math.max(startFinishes + 10, endFinishes - 3);
      const endHandover = startHandover + dHandover;

      const phasesConfig = [
        {
          name: "Substructure & Foundation",
          offsetDays: startFoundation,
          duration: dFoundation,
          reason: `Excavation, anti-termite, PCC & column footings for ${footprint.toLocaleString()} sq ft plinth footprint`,
          description: `Site clearance, earthwork excavation, PCC, footing reinforcement, plinth beam casting and earth backfilling.`
        },
        {
          name: "RCC Structural Framework",
          offsetDays: startStructure,
          duration: dStructure,
          reason: `RCC frame for ${floorLabel} (${floorsCount} slabs @ ~20 days shuttering, rebar & curing cycle)`,
          description: `Column casting, beam and slab shuttering, reinforcement tying, electrical box insertion, RMC pouring and de-shuttering.`
        },
        {
          name: "Brickwork & Partition Walls",
          offsetDays: startBrickwork,
          duration: dBrickwork,
          reason: `External & internal AAC / red brick masonry for ${floorsCount} floors (${bhkCount} BHK partition layout)`,
          description: `9" perimeter load/weather walls, 4.5" internal room partition walls, lintel casting and door frame fixing.`
        },
        {
          name: "MEP Concealed Rough-In",
          offsetDays: startMep,
          duration: dMep,
          reason: `Concealed conduit piping, drainage lines & electrical circuits for ${bhkCount} BHK across ${floorsCount} floors`,
          description: `Wall chasing, PVC electrical conduits, distribution boxes, CPVC water supply lines, SWR drainage stacks and AC sleeves.`
        },
        {
          name: "Wall & Ceiling Plastering",
          offsetDays: startPlastering,
          duration: dPlastering,
          reason: `2-coat cement/gypsum plastering & ceiling finishing across ${areaSqFt.toLocaleString()} sq ft built-up area`,
          description: `Internal smooth gypsum/cement plaster, external 2-coat sand-faced plaster with waterproofing compound and 10-day curing.`
        },
        {
          name: "Waterproofing, Flooring & Tiling",
          offsetDays: startFlooring,
          duration: dFlooring,
          reason: `Wet-area waterproofing & vitrified tile / marble flooring for ${areaSqFt.toLocaleString()} sq ft built-up space`,
          description: `Terrace and bathroom waterproofing membrane with pond testing, vitrified flooring, bathroom wall dado and kitchen granite counter.`
        },
        {
          name: "Finishes, Painting & Fixtures",
          offsetDays: startFinishes,
          duration: dFinishes,
          reason: `Putty, emulsion painting, door shutters, modular switches & sanitary fittings for ${bhkCount} BHK`,
          description: `Wall putty, 2-coat interior & exterior emulsion paint, door shutters & hardware, modular switch plates and sanitary ware.`
        },
        {
          name: "External Paving, Snagging & Handover",
          offsetDays: startHandover,
          duration: dHandover,
          reason: `Boundary development, snag list rectification, final deep cleaning & occupancy clearance`,
          description: `Interlocking paver blocks, compound gate, site debris removal, deep acid wash, snag clearance and final keys handover.`
        }
      ];

      const DAY_MS = 24 * 60 * 60 * 1000;
      const suggestions = phasesConfig.map((p, idx) => {
        const sugStart = new Date(effectiveStart.getTime() + p.offsetDays * DAY_MS);
        const sugEnd = new Date(sugStart.getTime() + p.duration * DAY_MS);

        return {
          project_id,
          company_id: user.company_id || null,
          type: "MILESTONE",
          name: p.name,
          description: p.description,
          suggested_start: sugStart,
          suggested_end: sugEnd,
          duration_days: p.duration,
          reason: p.reason,
          source: "AUTO_GENERATED",
          status: "SUGGESTED" as const,
          sort_order: idx,
        };
      });

      await prisma.intelligenceSuggestion.createMany({
        data: suggestions,
      });

      // Fetch and return the created suggestions
      const all = await prisma.intelligenceSuggestion.findMany({
        where: { project_id, status: "SUGGESTED" },
        orderBy: { sort_order: "asc" },
      });

      return created(all, "Suggestions generated");
    }

    // Action: create — manually create a single suggestion
    if (action === "create") {
      const { name, description, suggested_start, suggested_end, duration_days, reason } = body;

      if (!name) return badRequest("name is required");

      const suggestion = await prisma.intelligenceSuggestion.create({
        data: {
          project_id,
          company_id: user.company_id || null,
          type: "MILESTONE",
          name,
          description: description || null,
          suggested_start: suggested_start ? new Date(suggested_start) : null,
          suggested_end: suggested_end ? new Date(suggested_end) : null,
          duration_days: duration_days || null,
          reason: reason || "Manually created suggestion",
          source: "MANUAL",
          status: "SUGGESTED",
          sort_order: 999,
        },
      });

      return created(suggestion, "Suggestion created");
    }

    return badRequest("Invalid action. Use 'generate' or 'create'");
  } catch (error: any) {
    console.error("Suggestion error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
