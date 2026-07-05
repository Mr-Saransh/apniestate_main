const { PrismaClient, Role, ProjectStatus, SiteStatus, TaskStatus, TaskPriority, WorkerStatus } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding demo accounts and data...');

  // 1. Create Company
  const company = await prisma.company.create({
    data: {
      name: 'Apni Estate Corp'
    }
  });

  const password_hash = bcrypt.hashSync('password123', 10);

  // 2. Create Users
  const users = [
    { email: 'builder@apniestate.com', name: 'Bob Builder', role: Role.BUILDER },
    { email: 'supervisor@apniestate.com', name: 'Sam Supervisor', role: Role.SITE_SUPERVISOR },
    { email: 'pm@apniestate.com', name: 'Paul PM', role: Role.PROJECT_MANAGER },
    { email: 'accountant@apniestate.com', name: 'Alice Accountant', role: Role.ACCOUNTANT }
  ];

  const createdUsers = {};
  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { role: u.role, company_id: company.id, password_hash },
      create: {
        email: u.email,
        name: u.name,
        role: u.role,
        password_hash,
        company_id: company.id,
        onboarded: true,
      }
    });
    createdUsers[u.role] = user;

    // Company Membership
    await prisma.companyMembership.upsert({
      where: {
        user_id_company_id: { user_id: user.id, company_id: company.id }
      },
      update: {},
      create: {
        user_id: user.id,
        company_id: company.id,
        roles: [u.role]
      }
    });
  }

  // 3. Create Projects
  const project1 = await prisma.project.create({
    data: {
      name: 'Skyline Tower',
      description: 'Luxury high-rise residential',
      builder_id: createdUsers[Role.BUILDER].id,
      manager_id: createdUsers[Role.PROJECT_MANAGER].id,
      status: ProjectStatus.ACTIVE,
      start_date: new Date('2026-01-01'),
      budget: 5000000,
      actual_cost: 1200000,
      progress_percentage: 35,
      company_id: company.id
    }
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'Greenwood Villas',
      description: 'Gated community villas',
      builder_id: createdUsers[Role.BUILDER].id,
      manager_id: createdUsers[Role.PROJECT_MANAGER].id,
      status: ProjectStatus.ACTIVE,
      start_date: new Date('2026-03-01'),
      budget: 3000000,
      actual_cost: 450000,
      progress_percentage: 15,
      company_id: company.id
    }
  });

  // 4. Create Sites
  const site1 = await prisma.site.create({
    data: {
      name: 'Tower A',
      project_id: project1.id,
      supervisor_id: createdUsers[Role.SITE_SUPERVISOR].id,
      status: SiteStatus.IN_PROGRESS,
      location: 'Plot 1A, City Center',
      company_id: company.id
    }
  });

  const site2 = await prisma.site.create({
    data: {
      name: 'Villa Cluster 1',
      project_id: project2.id,
      supervisor_id: createdUsers[Role.SITE_SUPERVISOR].id,
      status: SiteStatus.IN_PROGRESS,
      location: 'Greenwood Estate, Outskirts',
      company_id: company.id
    }
  });

  // 5. Create Tasks
  await prisma.task.createMany({
    data: [
      {
        title: 'Foundation concrete pouring',
        project_id: project1.id,
        site_id: site1.id,
        assignee_id: createdUsers[Role.SITE_SUPERVISOR].id,
        created_by: createdUsers[Role.PROJECT_MANAGER].id,
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        due_date: new Date(Date.now() + 86400000 * 2), // 2 days from now
        company_id: company.id
      },
      {
        title: 'Steel reinforcement for ground floor',
        project_id: project1.id,
        site_id: site1.id,
        assignee_id: createdUsers[Role.SITE_SUPERVISOR].id,
        created_by: createdUsers[Role.PROJECT_MANAGER].id,
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        due_date: new Date(Date.now() + 86400000 * 5), // 5 days from now
        company_id: company.id
      },
      {
        title: 'Site clearing and excavation',
        project_id: project2.id,
        site_id: site2.id,
        assignee_id: createdUsers[Role.SITE_SUPERVISOR].id,
        created_by: createdUsers[Role.PROJECT_MANAGER].id,
        status: TaskStatus.DONE,
        priority: TaskPriority.HIGH,
        due_date: new Date(),
        company_id: company.id
      }
    ]
  });

  // 6. Create Workers
  await prisma.worker.createMany({
    data: [
      {
        name: 'Raju Mason',
        trade: 'Mason',
        daily_rate: 800,
        status: WorkerStatus.ACTIVE,
        company_id: company.id,
        project_id: project1.id
      },
      {
        name: 'Shyam Helper',
        trade: 'Helper',
        daily_rate: 500,
        status: WorkerStatus.ACTIVE,
        company_id: company.id,
        project_id: project1.id
      }
    ]
  });

  console.log('Demo accounts and data seeded successfully.');
  console.log('Accounts created:');
  console.log('- builder@apniestate.com (password123)');
  console.log('- supervisor@apniestate.com (password123)');
  console.log('- pm@apniestate.com (password123)');
  console.log('- accountant@apniestate.com (password123)');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    pool.end();
  });
