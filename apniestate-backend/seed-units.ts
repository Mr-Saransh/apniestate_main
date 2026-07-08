import { PrismaClient, UnitType, UnitStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const projectId = 'proj_bahria_commercial'; // Make sure this matches the real DB project ID
  
  console.log('Seeding dummy units for project:', projectId);

  const dummyUnits = [
    {
      project_id: projectId,
      unit_number: 'TEST-A101',
      type: UnitType.MALL_SHOP,
      status: UnitStatus.SOLD,
      price: 15000000,
      client_name: 'John Doe',
    },
    {
      project_id: projectId,
      unit_number: 'TEST-A102',
      type: UnitType.MALL_SHOP,
      status: UnitStatus.SOLD,
      price: 20000000,
      client_name: 'Jane Smith',
    },
    {
      project_id: projectId,
      unit_number: 'TEST-B201',
      type: UnitType.HOUSE,
      status: UnitStatus.SOLD,
      price: 12500000,
      client_name: 'Bob Builder',
    },
    {
      project_id: projectId,
      unit_number: 'TEST-B202',
      type: UnitType.HOUSE,
      status: UnitStatus.BOOKED,
      price: 11000000,
      client_name: 'Alice Cooper',
    },
    {
      project_id: projectId,
      unit_number: 'TEST-C301',
      type: UnitType.OTHER,
      custom_type: 'KIOSK',
      status: UnitStatus.VACANT,
      price: 5000000,
      client_name: null,
    }
  ];

  for (const unit of dummyUnits) {
    try {
      await prisma.projectUnit.create({
        data: unit
      });
      console.log(`Created unit ${unit.unit_number}`);
    } catch (e: any) {
      console.error(`Failed to create unit ${unit.unit_number}:`, e.message);
    }
  }

  console.log('Done seeding dummy units.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
