const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const projects = await prisma.project.findMany({ select: { id: true, name: true, company_id: true } });
  console.log('Current projects in DB:');
  console.table(projects);
}

main().finally(() => prisma.$disconnect());
