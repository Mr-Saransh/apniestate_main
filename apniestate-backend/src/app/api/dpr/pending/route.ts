import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/response";

export const GET = withAuth(async (_req, user) => {
  const company_id = user.company_id || undefined;
  if (!company_id) {
    return ok({ pending: false });
  }

  let site = null;
  if (user.role === "SITE_SUPERVISOR") {
    site = await prisma.site.findFirst({
      where: { supervisor_id: user.sub, company_id }
    });
  }
  if (!site) {
    site = await prisma.site.findFirst({
      where: { company_id }
    });
  }

  if (!site) {
    return ok({ pending: false });
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const report = await prisma.dailyReport.findFirst({
    where: {
      site_id: site.id,
      report_date: today
    }
  });

  return ok({
    pending: !report,
    date: today
  });
});
