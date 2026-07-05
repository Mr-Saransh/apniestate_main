const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const companies = await prisma.company.findMany();
  console.log('Found companies:', companies.map(c => ({id: c.id, name: c.name})));
  
  if (companies.length === 0) return console.log('No companies found.');
  
  // Find the primary company we've been using (probably the one that has our projects/users)
  const users = await prisma.user.findMany({ include: { memberships: true } });
  let targetCompanyId = null;
  if (users.length > 0 && users[0].memberships.length > 0) {
    targetCompanyId = users[0].memberships[0].company_id;
  } else {
    targetCompanyId = companies[0].id;
  }
  
  console.log('Target company ID to keep:', targetCompanyId);
  
  // Rename the target company
  await prisma.company.update({
    where: { id: targetCompanyId },
    data: { name: 'Apni Estate Demo Company' }
  });
  console.log('Renamed target company to Apni Estate Demo Company');
  
  // Delete all others
  for (const c of companies) {
    if (c.id !== targetCompanyId) {
      console.log('Deleting company:', c.name, c.id);
      try {
        await prisma.company.delete({ where: { id: c.id } });
        console.log('Deleted successfully.');
      } catch (e) {
        console.log('Error deleting company (cascade might be missing):', e.message);
      }
    }
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
