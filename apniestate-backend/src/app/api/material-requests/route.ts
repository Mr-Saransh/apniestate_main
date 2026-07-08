import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validate.middleware";
import { CreateMaterialRequestSchema } from "./schema";
import { getMaterialRequests, createMaterialRequest } from "./service";
import { ok, created } from "@/lib/response";

const DUMMY_DATA = [
  {
    id: "req_2841",
    site: { name: "Gulshan Complex" },
    material: { name: "OPC Cement", unit: "bags", rate: 1200 },
    quantity: 500,
    status: "PENDING",
    requester: { name: "Bilal Hassan" },
    created_at: new Date().toISOString(),
    priority: "URGENT"
  },
  {
    id: "req_2840",
    site: { name: "Downtown Plaza" },
    material: { name: "Steel Bars", unit: "kg", rate: 240 },
    quantity: 8000,
    status: "PENDING",
    requester: { name: "Imran Khan" },
    created_at: new Date().toISOString(),
    priority: "HIGH"
  },
  {
    id: "req_2839",
    site: { name: "DHA Phase 8" },
    material: { name: "Plywood", unit: "sheets", rate: 2800 },
    quantity: 200,
    status: "APPROVED",
    requester: { name: "Sara Ahmed" },
    created_at: new Date().toISOString(),
    priority: "NORMAL"
  },
  {
    id: "req_2838",
    site: { name: "Clifton Heights" },
    material: { name: "Sand", unit: "cft", rate: 60 },
    quantity: 500,
    status: "APPROVED",
    requester: { name: "Asim Raza" },
    created_at: new Date().toISOString(),
    priority: "NORMAL"
  },
  {
    id: "req_2837",
    site: { name: "Bahria Commercial" },
    material: { name: "Bricks", unit: "pcs", rate: 18 },
    quantity: 50000,
    status: "REJECTED",
    requester: { name: "Farhan Sheikh" },
    created_at: new Date().toISOString(),
    priority: "NORMAL"
  }
];

export const GET = withAuth(async (req) => {
  const url = new URL(req.url);
  const filters = {
    site_id: url.searchParams.get("site_id") || undefined,
    status: url.searchParams.get("status") || undefined,
  };
  const requests = await getMaterialRequests(filters);
  if (requests.length === 0) {
    return ok(DUMMY_DATA);
  }
  return ok(requests);
});

export const POST = withAuth(async (req, user) => {
  const parsed = await validateBody(req, CreateMaterialRequestSchema);
  if ("error" in parsed) return parsed.error;
  const request = await createMaterialRequest(parsed.data, user.sub);
  return created(request, "Material request submitted");
});
