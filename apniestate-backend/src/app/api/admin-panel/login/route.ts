import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { ok, unauthorized, badRequest } from "@/lib/response";

const ADMIN_USERNAME = process.env.ADMIN_PANEL_USERNAME || "koushik@apniestate.in";
const ADMIN_PASSWORD = process.env.ADMIN_PANEL_PASSWORD || "koushik1221";
const ADMIN_JWT_SECRET = process.env.JWT_SECRET! + "_ADMIN_PANEL";

export async function POST(req: NextRequest) {
  let body;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid request body");
  }

  const { username, password } = body;

  if (!username || !password) {
    return badRequest("Username and password are required");
  }

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return unauthorized();
  }

  const token = jwt.sign(
    { sub: "admin_panel", role: "SUPER_ADMIN", username },
    ADMIN_JWT_SECRET,
    { expiresIn: "24h" }
  );

  return ok({ token, username }, "Admin login successful");
}
