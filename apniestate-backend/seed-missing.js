const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const c = await prisma.company.findFirst();
  if (!c) throw new Error("No company found");
  const company_id = c.id;
  
  await prisma.vendor.createMany({
    data: [
      { company_id, name: "Ittefaq Steel Mills", type: "MATERIAL_SUPPLIER", contact_person: "Ahmed Khan" },
      { company_id, name: "Pakland Cement Ltd", type: "MATERIAL_SUPPLIER", contact_person: "Ali Raza" },
      { company_id, name: "Sindh Brick Works", type: "MATERIAL_SUPPLIER", contact_person: "Nawab Siraj" }
    ],
    skipDuplicates: true,
  });

  await prisma.material.createMany({
    data: [
      { name: "Grade 60 Steel Rebar", category: "Steel", unit: "Tons", code: "STL-60", description: "High yield deformed steel bars" },
      { name: "Portland Cement (OPC)", category: "Cement", unit: "Bags", code: "CMT-OPC", description: "Ordinary Portland Cement 53 Grade" },
      { name: "A-Class Red Bricks", category: "Bricks", unit: "Thousands", code: "BRK-A", description: "First class burnt clay building bricks" }
    ],
    skipDuplicates: true,
  });
  
  console.log("Seeded 3 Vendors and 3 Materials successfully");
}
main().catch(console.error).finally(() => prisma.$disconnect());
