import { prisma } from "../../lib/prisma";

export interface SmartDprMaterialSuggestion {
  inventory_item_id: string;
  material_id: string;
  material_name: string;
  suggested_quantity: number;
  unit: string;
  available_quantity: number;
  source: "explicit" | "inferred";
  confidence: number;
  notes?: string;
}

export interface SmartDprMilestoneSuggestion {
  milestone_id: string;
  name: string;
  status: "IN_PROGRESS" | "COMPLETED";
  completion_percentage: number;
  notes?: string;
}

export interface SmartDprAnalysisResult {
  summary: string;
  work_completed: string;
  work_in_progress?: string | null;
  tomorrow_plan?: string | null;
  reasons_for_delay?: string | null;
  safety_observations?: string | null;
  quality_observations?: string | null;
  weather?: string | null;
  temperature?: number | null;
  completion_percentage?: number | null;
  milestone_suggestion?: SmartDprMilestoneSuggestion | null;
  material_suggestions: SmartDprMaterialSuggestion[];
  unmatched_materials: Array<{
    material_name: string;
    quantity?: number;
    unit?: string;
    reason: string;
  }>;
  is_fallback?: boolean;
}

const STOCK_IN_TYPES = ["IN", "GRN_RECEIPT", "RETURN", "TRANSFER_IN"];
const STOCK_OUT_TYPES = ["OUT", "MATERIAL_ISSUE", "DAMAGE", "TRANSFER_OUT"];

const GEMINI_MODELS = ["gemini-3.8-flash", "gemini-3.5-flash-lite"];

/**
 * Calls Gemini API with model fallback and retries.
 */
async function callGeminiApi(prompt: string, apiKey: string): Promise<any> {
  let lastError: any = null;

  for (const model of GEMINI_MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.1,
            },
          }),
        });

        if (res.status === 200) {
          const json = await res.json();
          const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            return JSON.parse(text);
          }
        }

        const errBody = await res.text();
        console.warn(`[SmartDPR] Gemini call failed (${model}, attempt ${attempt + 1}, status ${res.status}): ${errBody.slice(0, 200)}`);
        
        // Wait 1s before retry if 503 or 429
        if (res.status === 503 || res.status === 429) {
          await new Promise((r) => setTimeout(r, 1000));
        } else {
          break; // Try next model for other status codes (e.g. 404)
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[SmartDPR] Gemini network error (${model}, attempt ${attempt + 1}):`, err.message);
        await new Promise((r) => setTimeout(r, 800));
      }
    }
  }

  throw lastError || new Error("All Gemini models temporarily unavailable");
}

/**
 * Intelligent local regex fallback when Gemini is unavailable.
 */
function localRuleBasedFallback(
  text: string,
  siteInventory: Array<{ id: string; material_id: string; name: string; unit: string; availableStock: number }>,
  milestones: Array<{ id: string; name: string; progress_percentage: number | null }>
): SmartDprAnalysisResult {
  const lower = text.toLowerCase();

  // Summary
  const summary = text.length > 120 ? text.slice(0, 117) + "..." : text;
  const work_completed = text;

  // Weather extraction
  let weather = "Sunny";
  if (lower.includes("rain") || lower.includes("baarish")) weather = "Rainy";
  else if (lower.includes("cloud") || lower.includes("baadal")) weather = "Cloudy";
  else if (lower.includes("hot") || lower.includes("dhoop")) weather = "Sunny";

  // Temperature extraction
  const tempMatch = text.match(/(\d{1,2})\s*(?:°\s*C|degrees|degree|celsius)/i);
  const temperature = tempMatch ? parseFloat(tempMatch[1]) : null;

  // Milestone matching
  let milestone_suggestion: SmartDprMilestoneSuggestion | null = null;
  for (const m of milestones) {
    const mLower = m.name.toLowerCase();
    const words = mLower.split(/\s+/).filter((w) => w.length > 3);
    const matchesWord = words.some((w) => lower.includes(w));
    if (lower.includes(mLower) || matchesWord) {
      const isCompleted = lower.includes("complete") || lower.includes("done") || lower.includes("finish") || lower.includes("khatam");
      milestone_suggestion = {
        milestone_id: m.id,
        name: m.name,
        status: isCompleted ? "COMPLETED" : "IN_PROGRESS",
        completion_percentage: isCompleted ? 100 : Math.min(100, (m.progress_percentage || 0) + 20),
        notes: "Matched from site update keyword",
      };
      break;
    }
  }

  // Material extraction from inventory items
  const material_suggestions: SmartDprMaterialSuggestion[] = [];
  const unmatched_materials: SmartDprAnalysisResult["unmatched_materials"] = [];

  for (const item of siteInventory) {
    const itemNameLower = item.name.toLowerCase();
    const mainWord = itemNameLower.split(/\s+/)[0]; // e.g. "cement", "sand", "brick"
    if (lower.includes(itemNameLower) || lower.includes(mainWord)) {
      // Look for quantities near the word: e.g. "80 cement" or "cement 80" or "80 bags"
      const qtyRegex = new RegExp(`(?:(\\d+(?:\\.\\d+)?)\\s*(?:bags?|tons?|pcs?|kg|units?)?\\s*(?:of\\s*)?${mainWord}|${mainWord}\\s*[^0-9\\n]{0,20}(\\d+(?:\\.\\d+)?))`, "i");
      const match = text.match(qtyRegex);
      const qty = match ? parseFloat(match[1] || match[2] || "0") : 0;

      if (qty > 0) {
        material_suggestions.push({
          inventory_item_id: item.id,
          material_id: item.material_id,
          material_name: item.name,
          suggested_quantity: qty,
          unit: item.unit,
          available_quantity: item.availableStock,
          source: "explicit",
          confidence: 0.9,
          notes: `Explicit quantity of ${qty} ${item.unit} detected in text.`,
        });
      }
    }
  }

  return {
    summary,
    work_completed,
    work_in_progress: null,
    tomorrow_plan: null,
    reasons_for_delay: null,
    safety_observations: null,
    quality_observations: null,
    weather,
    temperature,
    completion_percentage: milestone_suggestion ? milestone_suggestion.completion_percentage : 100,
    milestone_suggestion,
    material_suggestions,
    unmatched_materials,
    is_fallback: true,
  };
}

/**
 * Main Smart DPR analysis engine.
 * Understands voice transcripts or typed text, extracts work details,
 * and proposes material consumption and milestone progression.
 */
export async function analyzeSmartDpr(
  text: string,
  siteId: string,
  projectId?: string
): Promise<SmartDprAnalysisResult> {
  if (!text || !text.trim()) {
    throw new Error("Report text is required for AI analysis");
  }
  if (!siteId) {
    throw new Error("Site ID is required");
  }

  // 1. Fetch Site & Project details
  const site = await prisma.site.findUnique({
    where: { id: siteId },
    include: { project: { select: { id: true, name: true } } },
  });

  if (!site) {
    throw new Error("Site not found");
  }

  const effectiveProjectId = projectId || site.project_id;

  // 2. Fetch inventory records ONLY for the selected site
  const rawInventory = await prisma.inventoryItem.findMany({
    where: { site_id: siteId },
    include: {
      material: { select: { id: true, name: true, unit: true, category: true, code: true } },
      transactions: true,
    },
    orderBy: { updated_at: "desc" },
  });

  const siteInventory = rawInventory.map((item) => {
    const stockIn = item.transactions.filter((t) => STOCK_IN_TYPES.includes(t.type)).reduce((s, t) => s + t.quantity, 0);
    const stockOut = item.transactions.filter((t) => STOCK_OUT_TYPES.includes(t.type)).reduce((s, t) => s + t.quantity, 0);
    const adjust = item.transactions.filter((t) => t.type === "ADJUST").reduce((s, t) => s + t.quantity, 0);
    const computedStock = stockIn - stockOut + adjust;
    const availableStock = Math.max(0, computedStock !== 0 ? computedStock : item.quantity);

    return {
      id: item.id,
      material_id: item.material_id,
      name: item.material.name,
      category: item.material.category || "General",
      unit: item.material.unit,
      code: item.material.code || "",
      availableStock,
    };
  });

  // 3. Fetch Milestones for this project
  const milestones = await prisma.milestone.findMany({
    where: { project_id: effectiveProjectId },
    select: { id: true, name: true, status: true, progress_percentage: true, target_date: true },
    orderBy: { target_date: "asc" },
  });

  // 4. Fetch BOQ Items for context
  const boqItems = await prisma.bOQItem.findMany({
    where: { category: { boq: { project_id: effectiveProjectId } } },
    select: { id: true, description: true, unit: true, quantity: true, used_quantity: true },
    take: 30,
  });

  const apiKey = process.env.GEMINI_API_KEY || "AIzaSyAVswtsus_sdSKEyEfl3ugc1rCITuR_dEo";

  // 5. Construct the Structured Prompt
  const prompt = `
You are the AI engine for Apni Estate Smart DPR (Daily Progress Report) for Indian construction projects.
A supervisor has entered or spoken the following daily update (may be in English, Hindi, or Hinglish):

"""
${text}
"""

PROJECT CONTEXT:
Project: ${site.project?.name || "Construction Project"}
Site: ${site.name}

AVAILABLE SITE INVENTORY (MANDATORY CONSTRAINT: ONLY MATCH FROM THIS LIST. NEVER INVENT ANY MATERIAL!):
${JSON.stringify(
  siteInventory.map((i) => ({
    inventory_item_id: i.id,
    material_id: i.material_id,
    material_name: i.name,
    category: i.category,
    unit: i.unit,
    available_quantity: i.availableStock,
  })),
  null,
  2
)}

CURRENT PROJECT MILESTONES:
${JSON.stringify(
  milestones.map((m) => ({
    milestone_id: m.id,
    name: m.name,
    current_status: m.status,
    current_progress: m.progress_percentage || 0,
  })),
  null,
  2
)}

BOQ REFERENCE:
${JSON.stringify(boqItems.map((b) => ({ description: b.description, unit: b.unit })), null, 2)}

INSTRUCTIONS & RULES:
1. SUMMARY: Write a concise, professional 1-2 sentence executive summary of today's progress.
2. WORK COMPLETED: Detail the specific construction activities completed today.
3. WORK IN PROGRESS: Activities ongoing or partially done, or null if none mentioned.
4. TOMORROW PLAN: Planned work or pending tasks for tomorrow, or null if not stated.
5. DELAY REASONS: Any delays, blockers, weather issues, or bottlenecks, or null.
6. SAFETY & QUALITY: Any safety observations or quality remarks, or null.
7. WEATHER & TEMPERATURE: Weather condition (Sunny, Cloudy, Rainy, Hot, Clear, etc.) and temperature in Celsius if stated.
8. MILESTONES:
   - If the update relates to any milestone listed above, suggest the match with status ("IN_PROGRESS" or "COMPLETED") and completion_percentage.
   - If brickwork or activity is stated as "completed", mark milestone as COMPLETED with 100%.
9. MATERIAL CONSUMPTION (CRITICAL):
   - Check if materials were explicitly reported (e.g. "80 cement bags", "2 tons sand", "5000 bricks").
   - MATCH ONLY to an item from the "AVAILABLE SITE INVENTORY" above.
   - If matched: source="explicit", confidence=0.95, suggested_quantity=number.
   - If activity implies material usage but quantity is unstated, you may suggest a likely material ONLY if in the site inventory, with source="inferred", confidence=0.6, and clear notes asking supervisor to verify.
   - NEVER invent a material.
   - If a material mentioned in text is NOT in the site inventory: DO NOT add to material_suggestions! Instead, add it to unmatched_materials with reason: "Material not available in this site's inventory."
10. Return strictly a JSON object matching this schema:
{
  "summary": "string",
  "work_completed": "string",
  "work_in_progress": "string or null",
  "tomorrow_plan": "string or null",
  "reasons_for_delay": "string or null",
  "safety_observations": "string or null",
  "quality_observations": "string or null",
  "weather": "string or null",
  "temperature": number or null,
  "completion_percentage": number or null,
  "milestone_suggestion": {
    "milestone_id": "string",
    "name": "string",
    "status": "IN_PROGRESS" | "COMPLETED",
    "completion_percentage": number,
    "notes": "string"
  } or null,
  "material_suggestions": [
    {
      "inventory_item_id": "string",
      "material_id": "string",
      "material_name": "string",
      "suggested_quantity": number,
      "unit": "string",
      "available_quantity": number,
      "source": "explicit" | "inferred",
      "confidence": number,
      "notes": "string"
    }
  ],
  "unmatched_materials": [
    {
      "material_name": "string",
      "quantity": number or null,
      "unit": "string or null",
      "reason": "Material not available in this site's inventory."
    }
  ]
}
`;

  try {
    const rawAiResult = await callGeminiApi(prompt, apiKey);

    // 6. Strict Server-Side Validation of AI Output
    const validatedMaterials: SmartDprMaterialSuggestion[] = [];
    const unmatched = Array.isArray(rawAiResult.unmatched_materials) ? [...rawAiResult.unmatched_materials] : [];

    if (Array.isArray(rawAiResult.material_suggestions)) {
      for (const sug of rawAiResult.material_suggestions) {
        // Find matching site inventory item by ID or exact material_id
        const matchedInv = siteInventory.find(
          (inv) =>
            inv.id === sug.inventory_item_id ||
            inv.material_id === sug.material_id ||
            inv.name.toLowerCase() === (sug.material_name || "").toLowerCase()
        );

        if (matchedInv && Number(sug.suggested_quantity) > 0) {
          validatedMaterials.push({
            inventory_item_id: matchedInv.id,
            material_id: matchedInv.material_id,
            material_name: matchedInv.name,
            suggested_quantity: Number(sug.suggested_quantity),
            unit: matchedInv.unit,
            available_quantity: matchedInv.availableStock,
            source: sug.source === "inferred" ? "inferred" : "explicit",
            confidence: typeof sug.confidence === "number" ? Math.min(1, Math.max(0, sug.confidence)) : 0.9,
            notes: sug.notes || undefined,
          });
        } else if (sug.material_name) {
          unmatched.push({
            material_name: sug.material_name,
            quantity: sug.suggested_quantity || null,
            unit: sug.unit || null,
            reason: "Material not available in this site's inventory.",
          });
        }
      }
    }

    // Validate milestone suggestion
    let validMilestone: SmartDprMilestoneSuggestion | null = null;
    if (rawAiResult.milestone_suggestion?.milestone_id) {
      const match = milestones.find((m) => m.id === rawAiResult.milestone_suggestion.milestone_id);
      if (match) {
        validMilestone = {
          milestone_id: match.id,
          name: match.name,
          status: rawAiResult.milestone_suggestion.status === "COMPLETED" ? "COMPLETED" : "IN_PROGRESS",
          completion_percentage: Number(rawAiResult.milestone_suggestion.completion_percentage) || 100,
          notes: rawAiResult.milestone_suggestion.notes,
        };
      }
    }

    return {
      summary: rawAiResult.summary || text.slice(0, 100),
      work_completed: rawAiResult.work_completed || text,
      work_in_progress: rawAiResult.work_in_progress || null,
      tomorrow_plan: rawAiResult.tomorrow_plan || null,
      reasons_for_delay: rawAiResult.reasons_for_delay || null,
      safety_observations: rawAiResult.safety_observations || null,
      quality_observations: rawAiResult.quality_observations || null,
      weather: rawAiResult.weather || "Sunny",
      temperature: rawAiResult.temperature ? Number(rawAiResult.temperature) : null,
      completion_percentage: validMilestone ? validMilestone.completion_percentage : rawAiResult.completion_percentage || null,
      milestone_suggestion: validMilestone,
      material_suggestions: validatedMaterials,
      unmatched_materials: unmatched,
      is_fallback: false,
    };
  } catch (err: any) {
    console.warn("[SmartDPR] Gemini failed or returned error, applying smart local fallback:", err?.message || err);
    return localRuleBasedFallback(text, siteInventory, milestones);
  }
}
