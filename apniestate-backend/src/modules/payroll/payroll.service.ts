import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, parseISO } from "date-fns";

export async function generateMonthlyPayroll(userId: string, month: number, year: number, siteId?: string) {
  // Construct date range for the month
  const startDate = new Date(year, month - 1, 1);
  const endDate = endOfMonth(startDate);

  // Fetch all workers to calculate
  const whereWorker: any = { is_active: true };
  if (siteId) {
    whereWorker.site_id = siteId;
  }
  
  const workers = await prisma.worker.findMany({
    where: whereWorker,
    include: {
      site: true,
      contractor: true,
      attendances: {
        where: {
          date: {
            gte: startDate,
            lte: endDate
          }
        }
      }
    }
  });

  const payrollCalculations = [];

  for (const worker of workers) {
    let presentDays = 0;
    let halfDays = 0;
    let absentDays = 0;
    let overtimeHours = 0;

    for (const att of worker.attendances) {
      if (att.status === "PRESENT" || att.status === "LATE") {
        presentDays++;
      } else if (att.status === "HALF_DAY") {
        halfDays++;
      } else if (att.status === "ABSENT") {
        absentDays++;
      }
      if (att.overtime_hours) {
        overtimeHours += att.overtime_hours;
      }
    }

    const dailyRate = worker.daily_rate || 0;
    const presentPay = presentDays * dailyRate;
    const halfDayPay = halfDays * (dailyRate / 2);
    // Standard OT calculation: Daily rate / 8 hours * 1.5 multiplier
    const hourlyRate = dailyRate / 8;
    const otRate = hourlyRate * 1.5;
    const otPay = overtimeHours * otRate;
    
    const grossAmount = presentPay + halfDayPay + otPay;
    // We will hardcode 0 deductions for now since Advance management isn't fully spec'd in schema
    const deductions = 0; 
    const netAmount = grossAmount - deductions;

    // Check if wage entry exists
    const existingWage = await prisma.workerWage.findFirst({
      where: {
        worker_id: worker.id,
        period_start: startDate,
        period_end: endDate
      }
    });

    let wageRecord;
    if (existingWage) {
      wageRecord = await prisma.workerWage.update({
        where: { id: existingWage.id },
        data: {
          present_days: presentDays,
          overtime_hours: overtimeHours,
          daily_rate: dailyRate,
          overtime_rate: otRate,
          gross_amount: grossAmount,
          deductions: deductions,
          net_amount: netAmount
        }
      });
    } else {
      wageRecord = await prisma.workerWage.create({
        data: {
          worker_id: worker.id,
          period_start: startDate,
          period_end: endDate,
          present_days: presentDays,
          overtime_hours: overtimeHours,
          daily_rate: dailyRate,
          overtime_rate: otRate,
          gross_amount: grossAmount,
          deductions: deductions,
          net_amount: netAmount,
          status: "PENDING"
        }
      });
    }

    // Audit log
    await prisma.activityLog.create({
      data: {
        user_id: userId,
        entity_type: "WorkerWage",
        entity_id: wageRecord.id,
        action: "CALCULATE_PAYROLL",
        metadata: {
          month, year, grossAmount, netAmount
        }
      }
    });

    payrollCalculations.push({
      workerId: worker.id,
      workerName: worker.name,
      trade: worker.trade,
      dailyRate: dailyRate,
      presentDays,
      halfDays,
      absentDays,
      overtimeHours,
      presentPay,
      halfDayPay,
      otPay,
      grossAmount,
      deductions,
      netAmount,
      wageRecordId: wageRecord.id
    });
  }

  return payrollCalculations;
}

export async function getPayrollRecords(month: number, year: number, siteId?: string) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = endOfMonth(startDate);

  const whereClause: any = {
    period_start: startDate,
    period_end: endDate
  };

  if (siteId) {
    whereClause.worker = { site_id: siteId };
  }

  const wages = await prisma.workerWage.findMany({
    where: whereClause,
    include: {
      worker: {
        include: {
          site: true,
          contractor: true,
          attendances: {
            where: {
              date: {
                gte: startDate,
                lte: endDate
              }
            }
          }
        }
      }
    },
    orderBy: {
      worker: { name: 'asc' }
    }
  });

  return wages.map(w => {
    let halfDays = 0;
    let absentDays = 0;
    let leaveDays = 0;

    for (const att of w.worker.attendances) {
      if (att.status === "HALF_DAY") halfDays++;
      else if (att.status === "ABSENT") absentDays++;
      else if (att.status === "ON_LEAVE") leaveDays++;
    }

    return {
      id: w.id,
      workerName: w.worker.name,
      trade: w.worker.trade,
      dailyRate: w.daily_rate,
      presentDays: w.present_days,
      halfDays,
      absentDays,
      leaveDays,
      overtimeHours: w.overtime_hours,
      totalDaysInMonth: endDate.getDate(),
      grossAmount: w.gross_amount,
      deductions: w.deductions,
      netAmount: w.net_amount,
      status: w.status,
      siteName: w.worker.site?.name || null,
      contractorName: w.worker.contractor?.name || null
    };
  });
}
