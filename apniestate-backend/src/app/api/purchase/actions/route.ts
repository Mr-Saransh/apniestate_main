import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/middleware/auth.middleware';

export const POST = withAuth(async (request: Request, user: any) => {
  try {

    const body = await request.json();
    const { action, payload } = body;

    if (action === 'CREATE_REQUEST') {
      const { projectId, materialName, quantity, urgency } = payload;
      // Get the first site for the project (simplified)
      let site = await prisma.site.findFirst({ where: { project_id: projectId } });
      if (!site) {
        site = await prisma.site.create({
          data: {
            project_id: projectId,
            company_id: user.company_id,
            name: "Main Site",
            location: "Main Location",
            status: "IN_PROGRESS"
          }
        });
      }

      // Find or create material
      let material = await prisma.material.findFirst({ where: { name: materialName } });
      if (!material) {
        material = await prisma.material.create({
          data: { name: materialName, unit: 'pcs', company_id: user.company_id }
        });
      }

      const req = await prisma.materialRequest.create({
        data: {
          site_id: site.id,
          material_id: material.id,
          quantity: Number(quantity),
          status: 'PENDING_APPROVAL',
          requested_by: user.sub
        }
      });
      return NextResponse.json({ success: true, request: req });
    }

    if (action === 'UPDATE_REQUEST_STATUS') {
      const { requestId, status } = payload;
      const req = await prisma.materialRequest.update({
        where: { id: requestId },
        data: { status }
      });
      return NextResponse.json({ success: true, request: req });
    }

    if (action === 'CREATE_BOQ_ITEM') {
      const { projectId, name, unit, planned, rate } = payload;
      // Find or create BOQ for project
      let boq = await prisma.bOQ.findFirst({ 
        where: { project_id: projectId },
        orderBy: { version: 'desc' }
      });
      if (!boq) {
        boq = await prisma.bOQ.create({ data: { project_id: projectId, created_by: user.sub } });
      }
      
      // Find or create category
      let category = await prisma.bOQCategory.findFirst({ where: { boq_id: boq.id } });
      if (!category) {
        category = await prisma.bOQCategory.create({ data: { boq_id: boq.id, name: 'General' } });
      }

      const parsedRate = Number(rate) || 0;
      const parsedQty = Number(planned) || 0;

      const item = await prisma.bOQItem.create({
        data: {
          category_id: category.id,
          description: name,
          unit: unit,
          quantity: parsedQty,
          material_rate: parsedRate,
          total_rate: parsedRate,
          total_amount: parsedRate * parsedQty
        }
      });
      return NextResponse.json({ success: true, item });
    }

    if (action === 'CREATE_VENDOR') {
      const { name, category, phone } = payload;
      const vendor = await prisma.vendor.create({
        data: {
          company_id: user.company_id,
          name,
          category,
          phone
        }
      });
      return NextResponse.json({ success: true, vendor });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('Purchase Actions API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
});
