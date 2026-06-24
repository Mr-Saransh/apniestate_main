import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { generateMonthlyPayroll, getPayrollRecords } from "@/modules/payroll/payroll.service";
import { ok, created } from "@/lib/response";

export const GET = withAuth(async (req, user) => {
  const url = new URL(req.url);
  const monthStr = url.searchParams.get("month");
  const yearStr = url.searchParams.get("year");
  const siteId = url.searchParams.get("site_id") || undefined;
  
  const now = new Date();
  const month = monthStr ? parseInt(monthStr, 10) : (now.getMonth() + 1);
  const year = yearStr ? parseInt(yearStr, 10) : now.getFullYear();

  const records = await getPayrollRecords(month, year, siteId);
  return ok(records);
});

export const POST = withAuth(async (req, user) => {
  const body = await req.json();
  const { month, year, site_id } = body;
  
  const now = new Date();
  const m = month || (now.getMonth() + 1);
  const y = year || now.getFullYear();

  const results = await generateMonthlyPayroll(user.sub, m, y, site_id);
  return created(results, "Payroll generated successfully");
});
