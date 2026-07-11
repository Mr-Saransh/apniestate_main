const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const c = await prisma.company.findFirst();
  if (!c) throw new Error("No company found");
  const company_id = c.id;

  const project = await prisma.project.findFirst({ where: { company_id } });
  if (!project) throw new Error("No project found");
  const project_id = project.id;
  
  const user = await prisma.user.findFirst({ where: { company_id } });
  if (!user) throw new Error("No user found");
  const user_id = user.id;

  // Check if BOQ exists
  const existingBoq = await prisma.bOQ.findFirst({ where: { project_id } });
  if (existingBoq) {
    console.log("BOQ already seeded");
    return;
  }

  // Seed Approved BOQ
  const boq = await prisma.bOQ.create({
    data: {
      project_id,
      version: 1,
      status: 'APPROVED',
      total_estimated_cost: 1500000,
      created_by: user_id,
      approved_by: user_id,
      notes: "Initial Civil BOQ",
      categories: {
        create: [
          {
            name: "Civil Works",
            items: {
              create: [
                {
                  description: "Excavation",
                  quantity: 100,
                  unit: "cum",
                  labour_rate: 150,
                  equipment_rate: 300,
                  total_rate: 450,
                  total_amount: 45000
                },
                {
                  description: "Foundation Concrete (M20)",
                  quantity: 50,
                  unit: "cum",
                  material_rate: 4500,
                  labour_rate: 800,
                  equipment_rate: 200,
                  total_rate: 5500,
                  total_amount: 275000
                }
              ]
            }
          },
          {
            name: "Electrical Works",
            items: {
              create: [
                {
                  description: "Wiring and Conduits",
                  quantity: 500,
                  unit: "m",
                  material_rate: 120,
                  labour_rate: 40,
                  total_rate: 160,
                  total_amount: 80000
                }
              ]
            }
          }
        ]
      }
    }
  });
  
  // Create some mock expenses for Equipment & Overhead
  await prisma.expense.createMany({
    data: [
      { amount: 15000, category: "EQUIPMENT", description: "Excavator Rental", user_id, project_id, date: new Date(), status: 'APPROVED' },
      { amount: 5000, category: "OFFICE", description: "Site office supplies", user_id, project_id, date: new Date(), status: 'APPROVED' }
    ]
  });

  console.log("Seeded BOQ & Cost Intelligence data successfully!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
