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
            where: { site_id, date: targetDate }
        });

        // 1. Fetch categories to compute cost
        const categoryIds = entries.map((e: any) => e.category_id);
        const categories = await tx.labourCategory.findMany({
            where: { id: { in: categoryIds } }
        });
        const categoryMap = categories.reduce((acc: any, cat: any) => {
            acc[cat.id] = cat;
            return acc;
        }, {});

        let totalComputedCost = 0;

        // Insert new logs and compute cost
        for (const entry of entries) {
            if (entry.present_count > 0 || entry.half_day_count > 0 || entry.ot_hours > 0) {
                const cat = categoryMap[entry.category_id];
                if (cat) {
                    const regularCost = (entry.present_count || 0) * cat.daily_wage;
                    const halfCost = (entry.half_day_count || 0) * (cat.daily_wage * cat.half_day_multiplier);
                    const otCost = (entry.ot_hours || 0) * ((cat.daily_wage / 8) * cat.ot_multiplier);
                    totalComputedCost += (regularCost + halfCost + otCost);
                }

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

        // Wait for all labour logs to be created
        await Promise.all(ops);

        // 2. Idempotent Finance Workflow: Upsert Expense
        const site = await tx.site.findUnique({ where: { id: site_id }, select: { project_id: true } });
        const refId = `LABOUR_LOG_${site_id}_${targetDate.toISOString().split('T')[0]}`;
        
        // Always delete existing auto-generated expense for this date to prevent duplicate deductions
        await tx.expense.deleteMany({
            where: { reference_id: refId }
        });

        // Create new expense if cost > 0
        if (totalComputedCost > 0) {
            await tx.expense.create({
                data: {
                    amount: totalComputedCost,
                    category: 'Labour',
                    description: `Automated deduction for daily labour attendance on ${targetDate.toISOString().split('T')[0]}`,
                    site_id,
                    project_id: site?.project_id,
                    user_id: user.sub,
                    date: targetDate,
                    status: 'APPROVED',
                    reference_id: refId,
                    company_id: user.company_id
                }
            });
        }

        return { success: true };
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Save logs error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to save logs' }, { status: 500 });
  }
});
