import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/middleware/auth.middleware';

export const GET = withAuth(async (request: any, user) => {
  try {
    if (!user.company_id) return NextResponse.json({ success: false, error: 'User has no company' }, { status: 403 });

    const categories = await prisma.labourCategory.findMany({
      where: { company_id: user.company_id },
      orderBy: { created_at: 'desc' }
    });

    return NextResponse.json({ success: true, data: categories });
  } catch (error: any) {
    console.error('Fetch categories error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch categories' }, { status: 500 });
  }
});

export const POST = withAuth(async (request: any, user) => {
  try {
    // Enforce Builder logic (only builder/admin can configure)
    if (user.role !== 'BUILDER' && user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    if (!user.company_id) return NextResponse.json({ success: false, error: 'User has no company' }, { status: 403 });

    const data = await request.json();

    const category = await prisma.labourCategory.create({
      data: {
        company_id: user.company_id,
        name: data.name,
        daily_wage: Number(data.daily_wage),
        half_day_multiplier: data.half_day_multiplier ? Number(data.half_day_multiplier) : 0.5,
        ot_multiplier: data.ot_multiplier ? Number(data.ot_multiplier) : 1.5,
        status: data.status || 'ACTIVE'
      }
    });

    return NextResponse.json({ success: true, data: category });
  } catch (error: any) {
    console.error('Create category error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to create category' }, { status: 500 });
  }
});

export const PUT = withAuth(async (request: any, user) => {
  try {
    if (user.role !== 'BUILDER' && user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    if (!user.company_id) return NextResponse.json({ success: false, error: 'User has no company' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ success: false, error: 'Missing category ID' }, { status: 400 });
    }

    const data = await request.json();

    const category = await prisma.labourCategory.update({
      where: { id, company_id: user.company_id },
      data: {
        name: data.name,
        daily_wage: Number(data.daily_wage),
        half_day_multiplier: data.half_day_multiplier ? Number(data.half_day_multiplier) : 0.5,
        ot_multiplier: data.ot_multiplier ? Number(data.ot_multiplier) : 1.5,
        status: data.status
      }
    });

    return NextResponse.json({ success: true, data: category });
  } catch (error: any) {
    console.error('Update category error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to update category' }, { status: 500 });
  }
});
