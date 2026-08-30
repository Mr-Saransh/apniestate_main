const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const keepProjectIds = [
    'proj_downtown_plaza',
    'proj_starter_horizon',
    'proj_growth_residency_1',
    'proj_growth_residency_2',
    'proj_growth_plaza',
  ];

  const allProjects = await prisma.project.findMany({
    select: { id: true, name: true },
  });

  const toDelete = allProjects.filter(p => !keepProjectIds.includes(p.id));
  console.log(`Deleting ${toDelete.length} extra projects...`);

  for (const p of toDelete) {
    console.log(`Cleaning dependencies for ${p.name} (${p.id})...`);
    
    // Clear all possible related tables with raw SQL
    const queries = [
      `DELETE FROM worker_attendance WHERE site_id IN (SELECT id FROM sites WHERE project_id = '${p.id}')`,
      `DELETE FROM worker_rates WHERE project_id = '${p.id}'`,
      `DELETE FROM boq_items WHERE project_id = '${p.id}'`,
      `DELETE FROM material_requests WHERE project_id = '${p.id}'`,
      `DELETE FROM material_issues WHERE project_id = '${p.id}'`,
      `DELETE FROM daily_progress_reports WHERE project_id = '${p.id}'`,
      `DELETE FROM dprs WHERE project_id = '${p.id}'`,
      `DELETE FROM project_delays WHERE project_id = '${p.id}'`,
      `DELETE FROM project_risks WHERE project_id = '${p.id}'`,
      `DELETE FROM change_orders WHERE project_id = '${p.id}'`,
      `DELETE FROM milestones WHERE project_id = '${p.id}'`,
      `DELETE FROM budgets WHERE project_id = '${p.id}'`,
      `DELETE FROM crm_deals WHERE project_id = '${p.id}'`,
      `DELETE FROM crm_leads WHERE project_id = '${p.id}'`,
      `DELETE FROM crm_properties WHERE project_id = '${p.id}'`,
      `DELETE FROM tasks WHERE project_id = '${p.id}'`,
      `DELETE FROM cashbook WHERE project_id = '${p.id}'`,
      `DELETE FROM expenses WHERE project_id = '${p.id}'`,
      `DELETE FROM invoices WHERE project_id = '${p.id}'`,
      `DELETE FROM purchase_orders WHERE project_id = '${p.id}'`,
      `DELETE FROM quotations WHERE project_id = '${p.id}'`,
      `DELETE FROM rfqs WHERE project_id = '${p.id}'`,
      `DELETE FROM units WHERE project_id = '${p.id}'`,
      `DELETE FROM sites WHERE project_id = '${p.id}'`,
      `DELETE FROM projects WHERE id = '${p.id}'`,
    ];

    for (const q of queries) {
      try {
        await prisma.$executeRawUnsafe(q);
      } catch (e) {
        // Table or column might not exist, ignore
      }
    }
    console.log(`✅ Deleted ${p.name}`);
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
