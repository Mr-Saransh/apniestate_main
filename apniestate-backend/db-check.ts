import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("--- Users ---");
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, company_id: true }
  });
  console.log(JSON.stringify(users, null, 2));

  console.log("\n--- Projects ---");
  const projects = await prisma.project.findMany();
  console.log(JSON.stringify(projects, null, 2));

  console.log("\n--- Sites ---");
  const sites = await prisma.site.findMany();
  console.log(JSON.stringify(sites, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
