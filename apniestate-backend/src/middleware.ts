import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3000";

export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const origin = req.headers.get("origin");
  const allowedOrigins = [FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"];
  const isAllowed = origin && allowedOrigins.includes(origin);
  
  res.headers.set("Access-Control-Allow-Origin", isAllowed ? origin : FRONTEND_URL);
  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: res.headers });
  }

  return res;
}

export const config = {
  matcher: "/api/:path*",
};
