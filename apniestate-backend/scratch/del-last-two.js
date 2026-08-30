const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const ids = ['proj_gulshan_residency', 'proj_dha_villas'];
  for (const id of ids) {
    console.log('Cleaning', id);
    const sites = await prisma.site.findMany({ where: { project_id: id }, select: { id: true } });
    const siteIds = sites.map(s => `'${s.id}'`).join(',');
    
    if (siteIds) {
      await prisma.$executeRawUnsafe(`DELETE FROM inventory_transactions WHERE item_id IN (SELECT id FROM inventory_items WHERE site_id IN (${siteIds}))`).catch(() => {});
      await prisma.$executeRawUnsafe(`DELETE FROM inventory_items WHERE site_id IN (${siteIds})`).catch(() => {});
      await prisma.$executeRawUnsafe(`DELETE FROM daily_reports WHERE site_id IN (${siteIds})`).catch(() => {});
      await prisma.$executeRawUnsafe(`DELETE FROM worker_attendances WHERE site_id IN (${siteIds})`).catch(() => {});
      await prisma.$executeRawUnsafe(`DELETE FROM site_attendances WHERE site_id IN (${siteIds})`).catch(() => {});
      await prisma.$executeRawUnsafe(`DELETE FROM material_requests WHERE site_id IN (${siteIds})`).catch(() => {});
      await prisma.$executeRawUnsafe(`DELETE FROM tasks WHERE site_id IN (${siteIds})`).catch(() => {});
      await prisma.$executeRawUnsafe(`DELETE FROM sites WHERE id IN (${siteIds})`).catch(() => {});
    }

    await prisma.$executeRawUnsafe(`DELETE FROM milestones WHERE project_id = '${id}'`).catch(() => {});
    await prisma.$executeRawUnsafe(`DELETE FROM budgets WHERE project_id = '${id}'`).catch(() => {});
    await prisma.$executeRawUnsafe(`DELETE FROM tasks WHERE project_id = '${id}'`).catch(() => {});
    await prisma.$executeRawUnsafe(`DELETE FROM expenses WHERE project_id = '${id}'`).catch(() => {});
    await prisma.$executeRawUnsafe(`DELETE FROM cashbook WHERE project_id = '${id}'`).catch(() => {});
    await prisma.$executeRawUnsafe(`DELETE FROM projects WHERE id = '${id}'`).catch(() => {});
    console.log('Deleted', id);
  }

  const remaining = await prisma.project.findMany({ select: { id: true, name: true } });
  console.log('\nFinal remaining projects:');
  console.table(remaining);
}

main().finally(() => prisma.$disconnect());
