import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { analyzeSmartDpr } from "@/modules/dpr/smart-dpr.service";
import { ok, badRequest } from "@/lib/response";

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const body = await req.json();
    const { text, site_id, project_id } = body;

    if (!text || typeof text !== "string" || !text.trim()) {
      return badRequest("Field input text or speech transcript is required");
    }

    if (!site_id) {
      return badRequest("site_id is required to anchor Smart DPR to the active site inventory");
    }

    const result = await analyzeSmartDpr(text.trim(), site_id, project_id);
    return ok(result);
  } catch (error: any) {
    console.error("[SmartDPR Analyze Route] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: { message: error.message || "Failed to analyze DPR update" },
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
});
