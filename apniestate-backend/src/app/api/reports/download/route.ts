import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";

export const GET = withAuth(async (req: NextRequest, user) => {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('project_id');
  const type = searchParams.get('type');
  const fromParam = searchParams.get('from') || searchParams.get('start_date');
  const toParam = searchParams.get('to') || searchParams.get('end_date');

  if (!projectId || !type) {
    return NextResponse.json({ error: 'project_id and type are required' }, { status: 400 });
  }

  // Parse start of fromDate (00:00:00.000) and end of toDate (23:59:59.999) safely
  let fromDate: Date | undefined;
  let toDate: Date | undefined;

  if (fromParam) {
    const d = new Date(fromParam);
    if (!isNaN(d.getTime())) {
      d.setHours(0, 0, 0, 0);
      fromDate = d;
    }
  }

  if (toParam) {
    const d = new Date(toParam);
    if (!isNaN(d.getTime())) {
      d.setHours(23, 59, 59, 999);
      toDate = d;
    }
  }

  const dateFilter: any = {};
  if (fromDate) dateFilter.gte = fromDate;
  if (toDate) dateFilter.lte = toDate;
  const hasDateFilter = Object.keys(dateFilter).length > 0;

  const dateSuffix = fromParam && toParam
    ? `_${fromParam}_to_${toParam}`
    : fromParam
    ? `_from_${fromParam}`
    : toParam
    ? `_until_${toParam}`
    : '';

  let csv = '';
  let filename = '';

  try {
    if (type === 'Finance Report') {
      const expenseWhere: any = { project_id: projectId };
      if (hasDateFilter) expenseWhere.date = dateFilter;

      const expenses = await prisma.expense.findMany({
        where: expenseWhere,
        orderBy: { date: 'desc' }
      });
      csv = 'Date,Category,Amount,Description,Status\n';
      expenses.forEach(e => {
        csv += `${new Date(e.date).toISOString().split('T')[0]},"${e.category}",${e.amount},"${(e.description || '').replace(/"/g, '""')}",${e.status}\n`;
      });
      filename = `finance_report${dateSuffix}.csv`;
    } 
    else if (type === 'Material Report') {
      const sites = await prisma.site.findMany({ where: { project_id: projectId }, select: { id: true } });
      const siteIds = sites.map(s => s.id);
      
      const inventory = await prisma.inventoryItem.findMany({
        where: { site_id: { in: siteIds } },
        include: { material: true, site: true }
      });

      // Also get consumption logs for this date range if specified
      const consumptionWhere: any = { site_id: { in: siteIds } };
      if (hasDateFilter) consumptionWhere.date = dateFilter;
      const consumptions = await prisma.materialConsumption.findMany({
        where: consumptionWhere,
        include: { material: true },
        orderBy: { date: 'desc' }
      });

      csv = 'Type,Material,Category,Quantity,Unit,Date,Site\n';
      inventory.forEach(i => {
        csv += `Current Stock,"${(i.material?.name || '').replace(/"/g, '""')}","${i.material?.category || ''}",${i.quantity},"${i.material?.unit || ''}",Current,"${(i.site?.name || '').replace(/"/g, '""')}"\n`;
      });

      consumptions.forEach(c => {
        csv += `Consumed,"${(c.material?.name || '').replace(/"/g, '""')}","${c.material?.category || ''}",${c.quantity},"${c.material?.unit || ''}",${new Date(c.date).toISOString().split('T')[0]},Site\n`;
      });

      filename = `material_report${dateSuffix}.csv`;
    }
    else if (type === 'Labour Report') {
      const sites = await prisma.site.findMany({ where: { project_id: projectId }, select: { id: true } });
      const siteIds = sites.map(s => s.id);
      
      const logWhere: any = { site_id: { in: siteIds } };
      if (hasDateFilter) logWhere.date = dateFilter;

      const logs = await prisma.labourLog.findMany({
        where: logWhere,
        include: { category: true, site: true },
        orderBy: { date: 'desc' }
      });

      csv = 'Date,Site,Category,Daily Wage,Present,Half Day,OT Hours,Total Cost\n';
      logs.forEach(l => {
        const catName = l.category?.name || 'Unknown';
        const wage = l.category?.daily_wage || 0;
        const total = l.total_cost || (l.present_count * wage + l.half_day_count * wage * (l.category?.half_day_multiplier || 0.5) + l.ot_hours * wage * (l.category?.ot_multiplier || 1.5) / 8);
        csv += `${new Date(l.date).toISOString().split('T')[0]},"${(l.site?.name || '').replace(/"/g, '""')}","${catName.replace(/"/g, '""')}",${wage},${l.present_count},${l.half_day_count},${l.ot_hours},${total.toFixed(2)}\n`;
      });
      filename = `labour_report${dateSuffix}.csv`;
    }
    else if (type === 'Milestone Progress Report') {
      const milestoneWhere: any = { project_id: projectId };
      if (hasDateFilter) milestoneWhere.target_date = dateFilter;

      const milestones = await prisma.milestone.findMany({
        where: milestoneWhere,
        orderBy: { target_date: 'asc' }
      });
      csv = 'Title,Target Date,Status\n';
      milestones.forEach(m => {
        csv += `"${(m.name || '').replace(/"/g, '""')}",${new Date(m.target_date).toISOString().split('T')[0]},${m.status}\n`;
      });
      filename = `milestone_progress${dateSuffix}.csv`;
    }
    else {
      // Monthly Summary
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { _count: { select: { sites: true, tasks: true, milestones: true } } }
      });
      csv = 'Metric,Value\n';
      csv += `Project Name,"${(project?.name || '').replace(/"/g, '""')}"\n`;
      csv += `Status,${project?.status || 'ACTIVE'}\n`;
      csv += `Progress,${project?.progress_percentage || 0}%\n`;
      csv += `Sites Count,${project?._count.sites || 0}\n`;
      csv += `Tasks Count,${project?._count.tasks || 0}\n`;
      csv += `Milestones Count,${project?._count.milestones || 0}\n`;
      if (fromParam && toParam) {
        csv += `Filter Period,${fromParam} to ${toParam}\n`;
      }
      filename = `monthly_summary${dateSuffix}.csv`;
    }

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (error: any) {
    console.error('Report Generation Error:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
});
