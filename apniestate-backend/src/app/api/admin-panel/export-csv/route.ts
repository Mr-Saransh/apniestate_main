import { NextRequest } from "next/server";
import { withAdminAuth } from "@/middleware/admin.middleware";
import { prisma } from "@/lib/prisma";
import { serverError } from "@/lib/response";

export const GET = withAdminAuth(async (_req: NextRequest, _admin) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: "BUILDER" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        city: true,
        state: true,
        subscription_status: true,
        profile_completed: true,
        created_at: true,
        subscriptions: {
          orderBy: { created_at: "desc" },
          take: 1,
          select: {
            type: true,
            status: true,
            amount: true,
            starts_at: true,
            expires_at: true,
            payment_id: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    // Build CSV
    const headers = [
      "Name",
      "Email",
      "Phone",
      "City",
      "State",
      "Subscription Status",
      "Subscription Type",
      "Amount",
      "Start Date",
      "Expiry Date",
      "Payment ID",
      "Profile Completed",
      "Signup Date",
    ];

    const rows = users.map((u) => {
      const sub = u.subscriptions[0];
      return [
        u.name || "",
        u.email || "",
        u.phone || "",
        u.city || "",
        u.state || "",
        u.subscription_status || "NONE",
        sub?.type || "N/A",
        sub?.amount?.toString() || "0",
        sub?.starts_at ? new Date(sub.starts_at).toISOString().split("T")[0] : "N/A",
        sub?.expires_at ? new Date(sub.expires_at).toISOString().split("T")[0] : "N/A",
        sub?.payment_id || "N/A",
        u.profile_completed ? "Yes" : "No",
        new Date(u.created_at).toISOString().split("T")[0],
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="apniestate_users_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (err: any) {
    console.error("CSV export error:", err);
    return serverError(err.message || "Failed to export CSV");
  }
});
