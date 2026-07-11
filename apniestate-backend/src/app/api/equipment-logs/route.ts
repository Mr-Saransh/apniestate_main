import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from "@/middleware/auth.middleware";

export const GET = withAuth(async (request: any, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const equipment_id = searchParams.get('equipment_id');
    const date = searchParams.get('date');

    const where: any = {};
    if (equipment_id) where.equipment_id = equipment_id;
    if (date) where.date = new Date(date);

    // If neither is provided, restrict to company's equipment
    if (!equipment_id && !date) {
        where.equipment = { company_id: user.company_id };
    }

    const logs = await prisma.equipmentLog.findMany({
      where,
      include: {
        equipment: true
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
    const { equipment_id, date, running_hours, fuel_used, status, notes } = data;

    if (!equipment_id || !date || !status) {
        return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
    }

    const targetDate = new Date(date);

    // Upsert the log for the day
    const log = await prisma.equipmentLog.findFirst({
        where: { equipment_id, date: targetDate }
    });

    let result;
    if (log) {
        result = await prisma.equipmentLog.update({
            where: { id: log.id },
            data: {
                running_hours: Number(running_hours) || 0,
                fuel_used: Number(fuel_used) || 0,
                status,
                notes
            }
        });
    } else {
        result = await prisma.equipmentLog.create({
            data: {
                equipment_id,
                date: targetDate,
                running_hours: Number(running_hours) || 0,
                fuel_used: Number(fuel_used) || 0,
                status,
                notes
            }
        });
    }

    // Also update the Equipment's current status if provided
    await prisma.equipment.update({
        where: { id: equipment_id },
        data: { status }
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Save log error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to save log' }, { status: 500 });
  }
});
