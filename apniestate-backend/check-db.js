const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const projects = await prisma.project.findMany();
  if (projects.length === 0) {
    console.log("No projects found");
    return;
  }
  
  for (const project of projects) {
    console.log("-------------------");
    console.log("Project:", project.id, project.name);

    const boqs = await prisma.bOQ.findMany({
      where: { project_id: project.id },
      orderBy: { version: 'desc' },
      include: {
        categories: {
          include: {
            items: true
          }
        }
      }
    });

    console.log("Total BOQs:", boqs.length);
    for (const boq of boqs) {
      console.log(`BOQ ID: ${boq.id}, Version: ${boq.version}, Status: ${boq.status}, CreatedAt: ${boq.created_at}`);
      for (const cat of boq.categories) {
        console.log(`  Cat: ${cat.name} (${cat.items.length} items)`);
        for (const item of cat.items) {
          console.log(`    Item: ${item.description}, Qty: ${item.quantity}, Rate: ${item.total_rate}`);
        }
      }
    }
  }
}

check().catch(console.error).finally(() => prisma.$disconnect());
