import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/response";

// GET /api/attendance/report?from=2026-06-01&to=2026-06-30&site_id=xxx&worker_id=xxx
export const GET = withAuth(async (req) => {
  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const siteId = url.searchParams.get("site_id");
  const workerId = url.searchParams.get("worker_id");

  const where: any = {};
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lte = new Date(to);
  }
  if (siteId) where.site_id = siteId;
  if (workerId) where.worker_id = workerId;

  const attendances = await prisma.workerAttendance.findMany({
    where,
    include: {
      worker: { select: { id: true, name: true, trade: true, daily_rate: true } },
      site: { select: { id: true, name: true } },
    },
    orderBy: [{ date: "desc" }, { worker: { name: "asc" } }],
  });

  // Compute per-worker summary
  const workerMap = new Map<string, {
    worker_id: string;
    worker_name: string;
    trade: string;
    daily_rate: number;
    present: number;
    absent: number;
    half_day: number;
    late: number;
    overtime: number;
    total_days: number;
  }>();

  attendances.forEach(a => {
    if (!workerMap.has(a.worker_id)) {
      workerMap.set(a.worker_id, {
        worker_id: a.worker_id,
        worker_name: a.worker?.name || "",
        trade: a.worker?.trade || "",
        daily_rate: a.worker?.daily_rate || 0,
        present: 0,
        absent: 0,
        half_day: 0,
        late: 0,
        overtime: 0,
        total_days: 0,
      });
    }
    const summary = workerMap.get(a.worker_id)!;
    summary.total_days++;
    if (a.status === "PRESENT") summary.present++;
    else if (a.status === "ABSENT") summary.absent++;
    else if (a.status === "HALF_DAY") summary.half_day++;
    if (a.is_late) summary.late++;
    summary.overtime += a.overtime_hours || 0;
  });

  const workerSummaries = Array.from(workerMap.values()).map(w => ({
    ...w,
    effective_days: w.present + (w.half_day * 0.5),
    attendance_rate: w.total_days > 0 ? Math.round((w.present / w.total_days) * 100) : 0,
    total_wage: (w.present + w.half_day * 0.5) * w.daily_rate + w.overtime * ((w.daily_rate / 8) * 1.5),
  }));

  const totalPresent = workerSummaries.reduce((s, w) => s + w.present, 0);
  const totalDays = workerSummaries.reduce((s, w) => s + w.total_days, 0);
  const totalPayable = workerSummaries.reduce((s, w) => s + w.total_wage, 0);

  return ok({
    records: attendances,
    summary: {
      total_workers: workerMap.size,
      total_records: attendances.length,
      overall_attendance_rate: totalDays > 0 ? Math.round((totalPresent / totalDays) * 100) : 0,
      total_payable: Math.round(totalPayable),
    },
    worker_summaries: workerSummaries,
  });
});
