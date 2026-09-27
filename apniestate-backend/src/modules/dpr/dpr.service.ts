import { prisma } from "../../lib/prisma";
import { CreateDprInput, UpdateDprInput } from "./dpr.schema";

const STOCK_IN_TYPES = ["IN", "GRN_RECEIPT", "RETURN", "TRANSFER_IN"];
const STOCK_OUT_TYPES = ["OUT", "MATERIAL_ISSUE", "DAMAGE", "TRANSFER_OUT"];

export async function getDprs(filters?: { project_id?: string; site_id?: string; date?: string; company_id?: string }) {
  const where: any = { deleted_at: null };
  if (filters?.site_id) where.site_id = filters.site_id;
  if (filters?.project_id) where.project_id = filters.project_id;
  if (filters?.company_id) where.company_id = filters.company_id;
  
  if (filters?.date) {
    const d = new Date(filters.date);
    d.setUTCHours(0, 0, 0, 0);
    where.report_date = d;
  }

  const dprs = await prisma.dailyReport.findMany({
    where,
    include: {
      site: { select: { id: true, name: true, project: { select: { id: true, name: true } } } },
      submitter: { select: { id: true, name: true } },
      milestone: { select: { id: true, name: true, status: true, progress_percentage: true } },
      material_consumptions: {
        include: {
          material: { select: { id: true, name: true, unit: true, category: true } }
        }
      }
    },
    orderBy: { report_date: "desc" }
  });

  return dprs;
}

export async function getDprById(id: string, companyId?: string) {
  const where: any = { id, deleted_at: null };
  if (companyId) where.company_id = companyId;

  return prisma.dailyReport.findUnique({
    where,
    include: {
      site: { select: { id: true, name: true, project: { select: { id: true, name: true } } } },
      submitter: { select: { id: true, name: true } },
      milestone: { select: { id: true, name: true, status: true, progress_percentage: true } },
      material_consumptions: {
        include: {
          material: { select: { id: true, name: true, unit: true, category: true } }
        }
      }
    }
  });
}

export async function generateDailySummaries(siteId: string, date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setUTCHours(23, 59, 59, 999);

  // Labour
  const attendances = await prisma.workerAttendance.findMany({
    where: { site_id: siteId, date: startOfDay },
    include: { worker: { select: { id: true, name: true, trade: true } } }
  });

  const workersPresent = attendances.filter(a => a.status === 'PRESENT').length;
  const workersAbsent = attendances.filter(a => a.status === 'ABSENT').length;
  const halfDays = attendances.filter(a => a.is_half_day).length;
  const totalOvertime = attendances.reduce((acc, a) => acc + (a.overtime_hours || 0), 0);
  const labourCost = attendances.reduce((acc, a) => acc + (a.daily_wage_snapshot || 0), 0);

  const attendance_data = {
    workersPresent, workersAbsent, halfDays, totalOvertime, labourCost,
    details: attendances.map(a => ({
      name: a.worker.name,
      trade: a.worker.trade,
      status: a.status,
      is_half_day: a.is_half_day,
      overtime: a.overtime_hours
    }))
  };

  // Materials
  const materialTxns = await prisma.inventoryTransaction.findMany({
    where: { 
      item: { site_id: siteId },
      created_at: { gte: startOfDay, lte: endOfDay }
    },
    include: { item: { include: { material: { select: { name: true, unit: true } } } } }
  });

  const materials_consumed = {
    consumed: materialTxns.filter(t => t.type === 'OUT').map(t => ({ name: t.item.material.name, quantity: t.quantity, unit: t.item.material.unit })),
    received: materialTxns.filter(t => t.type === 'IN').map(t => ({ name: t.item.material.name, quantity: t.quantity, unit: t.item.material.unit }))
  };

  // Tasks
  const tasks = await prisma.task.findMany({
    where: { site_id: siteId }
  });
  
  const issues_faced = {
    completed_tasks: tasks.filter(t => t.status === 'DONE' && t.updated_at >= startOfDay && t.updated_at <= endOfDay).map(t => t.title),
    pending_tasks: tasks.filter(t => t.status === 'TODO' || t.status === 'IN_PROGRESS').map(t => t.title),
    delayed_tasks: tasks.filter(t => t.due_date && t.due_date < new Date() && t.status !== 'DONE').map(t => t.title)
  };

  return { attendance_data, materials_consumed, issues_faced };
}

/**
 * Validates available stock for requested materials and commits transactions atomically.
 * Updates: InventoryItem, InventoryTransaction, MaterialConsumption, and BOQItem used_quantity.
 */
async function validateAndCommitConsumptions(
  tx: any,
  siteId: string,
  projectId: string,
  consumptions: Array<{ material_id: string; quantity: number; notes?: string | null; name?: string | null; unit?: string | null }>,
  dprId: string,
  reportDate: Date,
  userId: string,
  dprSummary: string
) {
  if (!consumptions || consumptions.length === 0) return [];

  // Group total requested consumption by material_id
  const totalRequestedMap = new Map<string, number>();
  for (const c of consumptions) {
    const qty = Number(c.quantity);
    if (qty > 0) {
      totalRequestedMap.set(c.material_id, (totalRequestedMap.get(c.material_id) || 0) + qty);
    }
  }

  // 1. Strict Validation: Ensure every material exists in site inventory and has sufficient stock
  const validatedItemsMap = new Map<string, any>();
  for (const [matId, reqTotal] of Array.from(totalRequestedMap.entries())) {
    const invItem = await tx.inventoryItem.findUnique({
      where: {
        material_id_site_id: {
          material_id: matId,
          site_id: siteId,
        },
      },
      include: {
        material: { select: { id: true, name: true, unit: true, code: true } },
        transactions: true,
      },
    });

    if (!invItem) {
      const mat = await tx.material.findUnique({ where: { id: matId }, select: { name: true } });
      throw new Error(`Material "${mat?.name || matId}" is not available in this site's inventory.`);
    }

    // Calculate actual stock available
    const stockIn = invItem.transactions.filter((t: any) => STOCK_IN_TYPES.includes(t.type)).reduce((s: number, t: any) => s + t.quantity, 0);
    const stockOut = invItem.transactions.filter((t: any) => STOCK_OUT_TYPES.includes(t.type)).reduce((s: number, t: any) => s + t.quantity, 0);
    const adjust = invItem.transactions.filter((t: any) => t.type === "ADJUST").reduce((s: number, t: any) => s + t.quantity, 0);
    const computedStock = stockIn - stockOut + adjust;
    const availableStock = stockIn > 0 ? Math.max(0, computedStock) : Math.max(0, invItem.quantity);

    if (reqTotal > availableStock) {
      throw new Error(
        `Insufficient stock. Available: ${availableStock} ${invItem.material.unit}, Requested: ${reqTotal} ${invItem.material.unit}`
      );
    }

    validatedItemsMap.set(matId, invItem);
  }

  // 2. Perform Deductions and Propagate to Modules
  const committedConsumptions = [];
  for (const c of consumptions) {
    const qty = Number(c.quantity);
    if (qty <= 0) continue;

    const invItem = validatedItemsMap.get(c.material_id);
    if (!invItem) continue;

    // 2a. Decrement stock from InventoryItem
    await tx.inventoryItem.update({
      where: { id: invItem.id },
      data: { quantity: { decrement: qty } },
    });

    // 2b. Create InventoryTransaction log
    await tx.inventoryTransaction.create({
      data: {
        item_id: invItem.id,
        type: "OUT",
        quantity: qty,
        notes: `Smart DPR consumption on ${reportDate.toISOString().split("T")[0]}: ${c.notes || dprSummary}`,
        user_id: userId,
      },
    });

    // 2c. Create MaterialConsumption record
    const consumptionRecord = await tx.materialConsumption.create({
      data: {
        site_id: siteId,
        material_id: c.material_id,
        quantity: qty,
        dpr_id: dprId,
        date: reportDate,
      },
      include: {
        material: { select: { id: true, name: true, unit: true } },
      },
    });
    committedConsumptions.push(consumptionRecord);

    // 2d. Update BOQ used_quantity if item matches project BOQ
    if (projectId) {
      try {
        const cleanMatName = invItem.material.name.trim();
        const boqItems = await tx.bOQItem.findMany({
          where: {
            category: { boq: { project_id: projectId } },
            OR: [
              { material_id: c.material_id },
              { description: { contains: cleanMatName, mode: "insensitive" } },
              { code: { equals: invItem.material.code || cleanMatName, mode: "insensitive" } },
            ],
          },
        });

        if (boqItems.length > 0) {
          await tx.bOQItem.update({
            where: { id: boqItems[0].id },
            data: { used_quantity: { increment: qty } },
          });
        }
      } catch (boqErr) {
        console.warn("[SmartDPR] Could not update BOQ item used_quantity:", boqErr);
      }
    }
  }

  return committedConsumptions;
}

export async function createDpr(data: CreateDprInput, userId: string, companyId?: string) {
  const reportDate = data.date ? new Date(data.date) : new Date();
  reportDate.setUTCHours(0, 0, 0, 0);

  // Get project_id from site if not provided
  const site = await prisma.site.findUnique({ where: { id: data.site_id }, select: { project_id: true } });
  const effectiveProjectId = data.project_id || site?.project_id || "";

  // Check duplicate
  const existing = await prisma.dailyReport.findFirst({
    where: { site_id: data.site_id, report_date: reportDate, deleted_at: null }
  });
  
  if (existing) {
    if (existing.status === 'DRAFT') {
      // If it was a draft, update it instead of throwing error
      return updateDpr(existing.id, data, companyId, userId);
    }
    throw new Error("A Daily Progress Report for this site on this date already exists.");
  }

  // Fetch daily summaries (labour attendance, existing material txns, tasks)
  const summaries = await generateDailySummaries(data.site_id, reportDate);

  const isApproved = data.status === "APPROVED";
  const consumptionsList = Array.isArray(data.consumptions) ? data.consumptions : [];

  return prisma.$transaction(async (tx) => {
    // 1. Create the DailyReport
    const dpr = await tx.dailyReport.create({
      data: {
        company_id: companyId,
        project_id: effectiveProjectId || null,
        milestone_id: data.milestone_id,
        site_id: data.site_id,
        submitted_by: userId,
        report_date: reportDate,
        summary: data.summary,
        weather: data.weather,
        temperature: data.temperature,
        start_time: data.start_time ? new Date(data.start_time) : null,
        end_time: data.end_time ? new Date(data.end_time) : null,
        work_completed: data.work_completed,
        work_in_progress: data.work_in_progress,
        tomorrow_plan: data.tomorrow_plan,
        completion_percentage: data.completion_percentage,
        reasons_for_delay: data.reasons_for_delay,
        safety_observations: data.safety_observations,
        quality_observations: data.quality_observations,
        visitor_notes: data.visitor_notes,
        remarks: data.remarks,
        status: data.status || "DRAFT",
        
        attendance_data: summaries.attendance_data as any,
        materials_consumed: {
          ...summaries.materials_consumed,
          pending_consumptions: !isApproved ? consumptionsList : [],
        } as any,
        issues_faced: summaries.issues_faced as any,
        photos: data.photos,
      },
      include: {
        site: { select: { id: true, name: true, project: { select: { id: true, name: true } } } },
        submitter: { select: { id: true, name: true } },
      }
    });

    // 2. If status is APPROVED, commit consumptions & milestone updates atomically
    if (isApproved && consumptionsList.length > 0) {
      await validateAndCommitConsumptions(
        tx,
        data.site_id,
        effectiveProjectId,
        consumptionsList,
        dpr.id,
        reportDate,
        userId,
        data.summary
      );
    }

    // 3. Update milestone progress if specified
    if (data.milestone_id && data.completion_percentage && data.completion_percentage > 0) {
      const milestone = await tx.milestone.findUnique({ where: { id: data.milestone_id } });
      if (milestone) {
        const newProgress = Math.min((milestone.progress_percentage || 0) + data.completion_percentage, 100);
        const isCompleted = newProgress === 100 || data.completion_percentage === 100;
        await tx.milestone.update({
          where: { id: milestone.id },
          data: {
            progress_percentage: isCompleted ? 100 : newProgress,
            status: isCompleted ? 'COMPLETED' : 'IN_PROGRESS',
            ...(isCompleted ? { actual_date: reportDate } : {})
          }
        });
      }
    }

    // Refetch the complete DPR with all relations
    return tx.dailyReport.findUnique({
      where: { id: dpr.id },
      include: {
        site: { select: { id: true, name: true, project: { select: { id: true, name: true } } } },
        submitter: { select: { id: true, name: true } },
        milestone: { select: { id: true, name: true, status: true, progress_percentage: true } },
        material_consumptions: {
          include: {
            material: { select: { id: true, name: true, unit: true, category: true } }
          }
        }
      }
    });
  }, { maxWait: 15000, timeout: 30000 });
}

export async function updateDpr(id: string, data: UpdateDprInput, companyId?: string, actingUserId?: string) {
  const existing = await getDprById(id, companyId);
  if (!existing) throw new Error("DPR not found");

  const effectiveUserId = actingUserId || existing.submitted_by;
  const siteId = data.site_id || existing.site_id;
  const effectiveProjectId = data.project_id || existing.project_id || existing.site?.project?.id || "";
  const reportDate = new Date(existing.report_date);

  const isTransitioningToApproved = data.status === "APPROVED" && existing.status !== "APPROVED";
  const consumptionsList = Array.isArray(data.consumptions)
    ? data.consumptions
    : (existing.materials_consumed as any)?.pending_consumptions || [];

  return prisma.$transaction(async (tx) => {
    // 1. Commit consumptions if transitioning to APPROVED
    if (isTransitioningToApproved && consumptionsList.length > 0) {
      await validateAndCommitConsumptions(
        tx,
        siteId,
        effectiveProjectId,
        consumptionsList,
        existing.id,
        reportDate,
        effectiveUserId,
        data.summary || existing.summary
      );
    }

    // 2. Update Milestone if linked and completion specified
    const targetMilestoneId = data.milestone_id !== undefined ? data.milestone_id : existing.milestone_id;
    const targetCompletionPct = data.completion_percentage !== undefined ? data.completion_percentage : existing.completion_percentage;

    if (targetMilestoneId && targetCompletionPct && targetCompletionPct > 0) {
      const milestone = await tx.milestone.findUnique({ where: { id: targetMilestoneId } });
      if (milestone) {
        const newProgress = Math.min((milestone.progress_percentage || 0) + targetCompletionPct, 100);
        const isCompleted = newProgress === 100 || targetCompletionPct === 100;
        await tx.milestone.update({
          where: { id: milestone.id },
          data: {
            progress_percentage: isCompleted ? 100 : newProgress,
            status: isCompleted ? 'COMPLETED' : 'IN_PROGRESS',
            ...(isCompleted ? { actual_date: reportDate } : {})
          }
        });
      }
    }

    // 3. Update the DailyReport fields
    const updateData: any = { ...data };
    delete updateData.consumptions;
    if (data.start_time) updateData.start_time = new Date(data.start_time);
    if (data.end_time) updateData.end_time = new Date(data.end_time);

    if (isTransitioningToApproved) {
      // Clear pending consumptions once approved
      updateData.materials_consumed = {
        ...(existing.materials_consumed as any),
        pending_consumptions: [],
      };
    }

    return tx.dailyReport.update({
      where: { id },
      data: updateData,
      include: {
        site: { select: { id: true, name: true, project: { select: { id: true, name: true } } } },
        submitter: { select: { id: true, name: true } },
        milestone: { select: { id: true, name: true, status: true, progress_percentage: true } },
        material_consumptions: {
          include: {
            material: { select: { id: true, name: true, unit: true, category: true } }
          }
        }
      }
    });
  }, { maxWait: 15000, timeout: 30000 });
}

export async function deleteDpr(id: string, companyId?: string) {
  const existing = await getDprById(id, companyId);
  if (!existing) throw new Error("DPR not found");

  return prisma.dailyReport.update({
    where: { id },
    data: { deleted_at: new Date() }
  });
}

// ─── Weekly Reports ─────────────────────────────────────────────

export async function generateWeeklyReport(data: { project_id: string; site_id?: string; start_date: string; end_date: string }, userId: string, companyId?: string) {
  const startDate = new Date(data.start_date);
  startDate.setUTCHours(0, 0, 0, 0);
  const endDate = new Date(data.end_date);
  endDate.setUTCHours(23, 59, 59, 999);

  // Fetch all DPRs for this week
  const where: any = { 
    project_id: data.project_id, 
    report_date: { gte: startDate, lte: endDate },
    deleted_at: null 
  };
  if (data.site_id) where.site_id = data.site_id;
  if (companyId) where.company_id = companyId;

  const dprs = await prisma.dailyReport.findMany({ where });

  // Aggregate Data
  let totalWorkers = 0;
  let totalLabourCost = 0;
  
  dprs.forEach(dpr => {
    if (dpr.attendance_data && typeof dpr.attendance_data === 'object') {
      const att = dpr.attendance_data as any;
      totalWorkers += (att.workersPresent || 0);
      totalLabourCost += (att.labourCost || 0);
    }
  });

  const attendance_summary = {
    total_workers_present: totalWorkers,
    total_labour_cost: totalLabourCost,
    days_reported: dprs.length
  };

  const completed_work = dprs.map(d => d.work_completed).filter(Boolean).join("\n\n");
  const delay_summary = dprs.map(d => d.reasons_for_delay).filter(Boolean).join("\n\n");
  const pending_work = dprs.length > 0 ? dprs[dprs.length - 1].tomorrow_plan : "";

  return prisma.weeklyReport.create({
    data: {
      company_id: companyId,
      project_id: data.project_id,
      site_id: data.site_id,
      generated_by: userId,
      week_start_date: startDate,
      week_end_date: endDate,
      completed_work,
      pending_work,
      delay_summary,
      attendance_summary,
      status: "GENERATED",
      site_health: delay_summary.length > 10 ? "AT_RISK" : "ON_TRACK"
    }
  });
}

export async function getWeeklyReports(filters?: { project_id?: string; site_id?: string; company_id?: string }) {
  const where: any = { deleted_at: null };
  if (filters?.site_id) where.site_id = filters.site_id;
  if (filters?.project_id) where.project_id = filters.project_id;
  if (filters?.company_id) where.company_id = filters.company_id;

  return prisma.weeklyReport.findMany({
    where,
    include: {
      project: { select: { id: true, name: true } },
      site: { select: { id: true, name: true } },
      generator: { select: { id: true, name: true } }
    },
    orderBy: { week_start_date: "desc" }
  });
}
