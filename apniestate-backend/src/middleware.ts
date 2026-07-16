import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3000";

export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const origin = req.headers.get("origin");
  
  // Ensure frontend URLs from env are supported even without trailing slash
  const cleanFrontendUrl = FRONTEND_URL.endsWith('/') ? FRONTEND_URL.slice(0, -1) : FRONTEND_URL;
  
  const allowedOrigins = [
    cleanFrontendUrl, 
    cleanFrontendUrl + "/", 
    "http://localhost:5173", 
    "http://localhost:3000",
    "https://build.apniestate.com"
  ];
  
  const isAllowed = origin && allowedOrigins.includes(origin);
  
  res.headers.set("Access-Control-Allow-Origin", isAllowed ? origin : cleanFrontendUrl);
  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, Cache-Control, Pragma, Expires");

  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: res.headers });
  }

  return res;
}

export const config = {
  matcher: "/api/:path*",
};
