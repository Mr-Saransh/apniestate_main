import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ success: true, data: { status: "ok", db: "connected" } });
  } catch {
    return Response.json({ success: false, data: { status: "error", db: "disconnected" } }, { status: 500 });
  }
}
