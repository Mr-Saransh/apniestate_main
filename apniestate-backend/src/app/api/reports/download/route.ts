import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";

export const GET = withAuth(async (req: NextRequest, user) => {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('project_id');
  const type = searchParams.get('type');

  if (!projectId || !type) {
    return NextResponse.json({ error: 'project_id and type are required' }, { status: 400 });
  }

  let csv = '';
  let filename = '';

  try {
    if (type === 'Finance Report') {
      const expenses = await prisma.expense.findMany({
        where: { project_id: projectId },
        orderBy: { date: 'desc' }
      });
      csv = 'Date,Category,Amount,Description,Status\n';
      expenses.forEach(e => {
        csv += `${new Date(e.date).toISOString().split('T')[0]},${e.category},${e.amount},${(e.description || '').replace(/,/g, ' ')},${e.status}\n`;
      });
      filename = 'finance_report.csv';
    } 
    else if (type === 'Material Report') {
      const sites = await prisma.site.findMany({ where: { project_id: projectId }, select: { id: true } });
      const siteIds = sites.map(s => s.id);
      
      const inventory = await prisma.inventoryItem.findMany({
        where: { site_id: { in: siteIds } },
        include: { material: true }
      });
      csv = 'Material,Category,Quantity,Unit\n';
      inventory.forEach(i => {
        csv += `${(i.material?.name || '').replace(/,/g, ' ')},${i.material?.category || ''},${i.quantity},${i.material?.unit || ''}\n`;
      });
      filename = 'material_report.csv';
    }
    else if (type === 'Labour Report') {
      const sites = await prisma.site.findMany({ where: { project_id: projectId }, select: { id: true } });
      const siteIds = sites.map(s => s.id);
      
      const logs = await prisma.labourLog.findMany({
        where: { site_id: { in: siteIds } },
        include: { category: true },
        orderBy: { date: 'desc' }
      });
      csv = 'Date,Category,Present,Half Day,OT Hours\n';
      logs.forEach(l => {
        csv += `${new Date(l.date).toISOString().split('T')[0]},${(l.category?.name || 'Unknown').replace(/,/g, ' ')},${l.present_count},${l.half_day_count},${l.ot_hours}\n`;
      });
      filename = 'labour_report.csv';
    }
    else if (type === 'Milestone Progress Report') {
      const milestones = await prisma.milestone.findMany({
        where: { project_id: projectId },
        orderBy: { target_date: 'asc' }
      });
      csv = 'Title,Target Date,Status\n';
      milestones.forEach(m => {
        csv += `${(m.name || '').replace(/,/g, ' ')},${new Date(m.target_date).toISOString().split('T')[0]},${m.status}\n`;
      });
      filename = 'milestone_progress.csv';
    }
    else {
      // Monthly Summary
      csv = 'Metric,Value\nReport,Generated\n';
      filename = 'summary_report.csv';
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
