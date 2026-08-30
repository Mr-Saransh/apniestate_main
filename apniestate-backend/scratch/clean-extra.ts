import { prisma } from '../src/lib/prisma';
import { deleteProject } from '../src/modules/projects/projects.service';

async function main() {
  const keepProjectIds = [
    'proj_downtown_plaza',
    'proj_starter_horizon',
    'proj_growth_residency_1',
    'proj_growth_residency_2',
    'proj_growth_plaza',
  ];

  const allProjects = await prisma.project.findMany({
    select: { id: true, name: true, company_id: true },
  });

  const toDelete = allProjects.filter(p => !keepProjectIds.includes(p.id));
  console.log(`Found ${toDelete.length} extra projects to remove...`);

  for (const p of toDelete) {
    console.log(`Deleting ${p.name} (${p.id})...`);
    try {
      await deleteProject(p.id, p.company_id);
      console.log(`✅ Deleted ${p.name}`);
    } catch (e: any) {
      console.log(`Failed to delete ${p.name}: ${e.message}`);
      // Fallback direct delete
      try {
        await prisma.project.delete({ where: { id: p.id } });
        console.log(`✅ Direct deleted ${p.name}`);
      } catch (err: any) {
        console.error(`❌ Could not delete ${p.name}: ${err.message}`);
      }
    }
  }

  const remaining = await prisma.project.findMany({
    select: { id: true, name: true, company_id: true, status: true },
  });
  console.log('\n✨ Remaining projects in database:');
  console.table(remaining);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
