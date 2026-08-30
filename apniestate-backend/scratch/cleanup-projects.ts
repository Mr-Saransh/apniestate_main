import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Listing all projects in database:');
  const allProjects = await prisma.project.findMany({
    select: { id: true, name: true, company_id: true, status: true },
  });
  console.table(allProjects);

  // Projects to keep:
  // 1. For Main Demo (admin@gmail.com / cl_demo_company_1): proj_downtown_plaza (Downtown Commercial Plaza)
  // 2. For Starter (starter@apniestate.com): proj_starter_1 (Starter Horizon Heights)
  // 3. For Growth (growth@apniestate.com): proj_growth_1, proj_growth_2, proj_growth_3
  
  const keepProjectIds = [
    'proj_downtown_plaza',
    'proj_starter_1',
    'proj_growth_1',
    'proj_growth_2',
    'proj_growth_3',
  ];

  const projectsToDelete = allProjects.filter((p) => !keepProjectIds.includes(p.id));

  console.log(`\n🗑️ Found ${projectsToDelete.length} extra projects to remove:`);
  for (const p of projectsToDelete) {
    console.log(` - Deleting project: ${p.name} (ID: ${p.id})`);
    
    // Delete dependent records first if any
    try {
      await prisma.projectDelay.deleteMany({ where: { project_id: p.id } });
      await prisma.projectRisk.deleteMany({ where: { project_id: p.id } });
      await prisma.changeOrder.deleteMany({ where: { project_id: p.id } });
      await prisma.milestone.deleteMany({ where: { project_id: p.id } });
      await prisma.budget.deleteMany({ where: { project_id: p.id } });
      await prisma.crmDeal.deleteMany({ where: { project_id: p.id } });
      await prisma.crmLead.deleteMany({ where: { project_id: p.id } });
      await prisma.crmProperty.deleteMany({ where: { project_id: p.id } });
      await prisma.task.deleteMany({ where: { project_id: p.id } });
      await prisma.cashbook.deleteMany({ where: { project_id: p.id } });
      await prisma.expense.deleteMany({ where: { project_id: p.id } });
      await prisma.invoice.deleteMany({ where: { project_id: p.id } });
      await prisma.purchaseOrder.deleteMany({ where: { project_id: p.id } });
      await prisma.quotation.deleteMany({ where: { project_id: p.id } });
      await prisma.rfq.deleteMany({ where: { project_id: p.id } });
      await prisma.materialIssue.deleteMany({ where: { project_id: p.id } });
      await prisma.materialRequest.deleteMany({ where: { project_id: p.id } });
      await prisma.dailyProgressReport.deleteMany({ where: { project_id: p.id } });
      await prisma.unit.deleteMany({ where: { project_id: p.id } });
      await prisma.site.deleteMany({ where: { project_id: p.id } });
      
      await prisma.project.delete({ where: { id: p.id } });
      console.log(`   ✅ Deleted ${p.name}`);
    } catch (e: any) {
      console.error(`   ❌ Failed to delete ${p.name}:`, e.message);
    }
  }

  console.log('\n✨ Remaining projects in database:');
  const remaining = await prisma.project.findMany({
    select: { id: true, name: true, company_id: true, status: true },
  });
  console.table(remaining);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
