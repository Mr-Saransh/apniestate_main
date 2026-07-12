import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/middleware/auth.middleware';

export const GET = withAuth(async (request: any, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');
    const site_id = searchParams.get('site_id');
    const project_id = searchParams.get('project_id');

    if (!user.company_id) return new NextResponse("Unauthorized", { status: 403 });

    const where: any = {
        category: { company_id: user.company_id }
    };
    
    if (site_id) where.site_id = site_id;
    if (project_id) {
        const sites = await prisma.site.findMany({ where: { project_id }});
        where.site_id = { in: sites.map((s: any) => s.id) };
    }
    
    if (start_date && end_date) {
        where.date = {
            gte: new Date(start_date),
            lte: new Date(end_date)
        };
    }

    const logs = await prisma.labourLog.findMany({
      where,
      include: {
        category: true,
        site: {
            include: { project: true }
        }
      },
      orderBy: { date: 'asc' }
    });

    let csvContent = "Date,Project,Site,Category,Daily Wage,Present,Half Day,OT Hours,Total Cost\n";

    logs.forEach((log: any) => {
        const dateStr = log.date.toISOString().split('T')[0];
        const projectName = log.site?.project?.name || 'N/A';
        const siteName = log.site?.name || 'N/A';
        const catName = log.category?.name || 'Unknown';
        const wage = log.category?.daily_wage || 0;
        
        const presentCost = log.present_count * wage;
        const halfDayCost = log.half_day_count * wage * (log.category?.half_day_multiplier || 0.5);
        const otCost = log.ot_hours * wage * (log.category?.ot_multiplier || 1.5) / 8; // approx hourly
        const totalCost = presentCost + halfDayCost + otCost;

        csvContent += `${dateStr},"${projectName}","${siteName}","${catName}",${wage},${log.present_count},${log.half_day_count},${log.ot_hours},${totalCost.toFixed(2)}\n`;
    });

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="labour_attendance_report.csv"'
      }
    });

  } catch (error: any) {
    console.error('CSV Export Error:', error);
    return new NextResponse("Failed to generate CSV", { status: 500 });
  }
});
