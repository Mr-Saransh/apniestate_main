const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const projectId = 'cmrhhwufa0007ugt8o49oy58p'; // hari nagar

  const boqs = await prisma.bOQ.findMany({
    where: { project_id: projectId },
    include: {
      categories: {
        include: {
          items: {
            include: { material: true }
          }
        }
      }
    },
    orderBy: { version: 'desc' },
    take: 1
  });

  console.log("Found BOQs:", boqs.length);
  
  const boqItems = boqs.length > 0 
    ? boqs[0].categories.flatMap(c => c.items).map(i => ({
        id: i.id,
        name: i.material?.name || i.description,
        unit: i.unit,
        planned: i.quantity,
        used: i.used_quantity,
      }))
    : [];
    
  console.log("Mapped items:", boqItems);
}

check().catch(console.error).finally(() => prisma.$disconnect());
