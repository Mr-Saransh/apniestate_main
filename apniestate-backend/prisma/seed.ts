import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding the database...');

  // Create an initial admin / Project Manager
  const passwordHash = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@apniestate.com' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@apniestate.com',
      password_hash: passwordHash,
      role: Role.PROJECT_MANAGER,
      phone: '+1234567890',
      is_active: true,
    },
  });

  console.log(`Created admin user: ${admin.email}`);

  // Create an initial Builder
  const builderPassword = await bcrypt.hash('builder123', 10);
  const builder = await prisma.user.upsert({
    where: { email: 'builder@apniestate.com' },
    update: {},
    create: {
      name: 'Lead Builder',
      email: 'builder@apniestate.com',
      password_hash: builderPassword,
      role: Role.BUILDER,
      phone: '+0987654321',
      is_active: true,
    },
  });

  console.log(`Created builder user: ${builder.email}`);

  // Create an initial project
  const project = await prisma.project.upsert({
    where: { id: 'cl_demo_project_1' },
    update: {},
    create: {
      id: 'cl_demo_project_1',
      name: 'Alpha Tower Construction',
      description: 'A 20-story commercial building in downtown.',
      builder_id: builder.id,
      manager_id: admin.id,
      status: 'ACTIVE',
      start_date: new Date(),
      budget: 15000000,
      address: '123 Alpha St',
      city: 'Metropolis',
    },
  });

  console.log(`Created demo project: ${project.name}`);

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
