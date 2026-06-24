import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/response";

export const GET = withAuth(async (_req, _user) => {
  const logs = await prisma.activityLog.findMany({
    take: 5,
    orderBy: { created_at: "desc" },
    include: {
      user: { select: { name: true } }
    }
  });

  const formatted = logs.map(l => {
    const userName = l.user?.name || "Someone";
    const entity = l.entity_type;
    const action = l.action;

    let text = `${entity} ${action.toLowerCase()} by ${userName}`;
    if (action === "CREATED" && entity === "Attendance") {
      text = `Attendance submitted by ${userName}`;
    } else if (action === "CREATED" && entity === "DPR") {
      text = `DPR submitted by ${userName}`;
    } else if (action === "UPDATED" && entity === "MaterialRequest") {
      text = `Material request updated by ${userName}`;
    } else if (action === "CREATED" && entity === "Task") {
      text = `Task created by ${userName}`;
    } else if (action === "COMPLETED" && entity === "Task") {
      text = `Task completed by ${userName}`;
    } else if (action === "APPROVED" && entity === "MaterialRequest") {
      text = `Material request approved by ${userName}`;
    }

    // Format time, e.g., 9:30 AM
    const formattedTime = new Date(l.created_at).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });

    return {
      id: l.id,
      text,
      time: formattedTime,
      created_at: l.created_at
    };
  });

  return ok(formatted);
});
