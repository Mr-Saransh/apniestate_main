import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/middleware/auth.middleware';

export const GET = withAuth(async (request: any, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const site_id = searchParams.get('site_id');
    const project_id = searchParams.get('project_id');
    const date = searchParams.get('date');
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');

    const where: any = {};
    if (site_id) where.site_id = site_id;
    if (project_id) {
        const sites = await prisma.site.findMany({ where: { project_id }});
        where.site_id = { in: sites.map((s: any) => s.id) };
    }
    
    if (date) {
        where.date = new Date(date);
    } else if (start_date && end_date) {
        where.date = {
            gte: new Date(start_date),
            lte: new Date(end_date)
        };
    }

    const logs = await prisma.labourLog.findMany({
      where,
      include: {
        category: true
      },
      orderBy: { date: 'desc' }
    });

    return NextResponse.json({ success: true, data: logs });
  } catch (error: any) {
    console.error('Fetch logs error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch logs' }, { status: 500 });
  }
});

export const POST = withAuth(async (request: any, user) => {
  try {
    const data = await request.json();
    const { site_id, date, entries } = data;

    if (!site_id || !date || !entries || !Array.isArray(entries)) {
        return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
    }

    const targetDate = new Date(date);

    // Using transaction to batch upsert all categories for the day
    const result = await prisma.$transaction(async (tx: any) => {
        const ops = [];

        // Delete existing logs for this site and date to replace them fresh
        await tx.labourLog.deleteMany({
            where: {
                site_id,
                date: targetDate
            }
        });

        // Insert new ones
        for (const entry of entries) {
            if (entry.present_count > 0 || entry.half_day_count > 0 || entry.ot_hours > 0) {
                ops.push(
                    tx.labourLog.create({
                        data: {
                            site_id,
                            category_id: entry.category_id,
                            date: targetDate,
                            present_count: Number(entry.present_count) || 0,
                            half_day_count: Number(entry.half_day_count) || 0,
                            ot_hours: Number(entry.ot_hours) || 0
                        }
                    })
                );
            }
        }

        return await Promise.all(ops);
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Save logs error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to save logs' }, { status: 500 });
  }
});
