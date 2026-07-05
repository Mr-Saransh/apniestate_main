const { PrismaClient, Role, ProjectStatus, SiteStatus, TaskStatus, TaskPriority, WorkerStatus, CashbookType } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding demo data for admin@gmail.com...');

  // 1. Get or create Company
  let company = await prisma.company.findFirst();
  if (!company) {
    company = await prisma.company.create({
      data: { name: 'Apni Estate Corp' }
    });
  }

  const password_hash = bcrypt.hashSync('admin123', 10);

  // 2. Create or Update admin@gmail.com
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: { 
      role: Role.BUILDER, 
      password_hash,
      company_id: company.id 
    },
    create: {
      email: 'admin@gmail.com',
      name: 'Admin Builder',
      role: Role.BUILDER,
      password_hash,
      company_id: company.id,
      onboarded: true,
    }
  });

  // Ensure Company Membership
  await prisma.companyMembership.upsert({
    where: {
      user_id_company_id: { user_id: adminUser.id, company_id: company.id }
    },
    update: {},
    create: {
      user_id: adminUser.id,
      company_id: company.id,
      roles: [Role.BUILDER]
    }
  });

  // Let's create a Project Manager so we can assign them to these new projects
  let pmUser = await prisma.user.findFirst({ where: { role: Role.PROJECT_MANAGER } });
  if (!pmUser) {
    pmUser = adminUser; // fallback
  }

  // Let's create a Supervisor so we can assign them to new sites
  let supUser = await prisma.user.findFirst({ where: { role: Role.SITE_SUPERVISOR } });
  if (!supUser) {
    supUser = adminUser; // fallback
  }

  // 3. Create Projects for admin@gmail.com
  const project1 = await prisma.project.create({
    data: {
      name: 'Admin Plaza',
      description: 'Commercial shopping complex',
      builder_id: adminUser.id,
      manager_id: pmUser.id,
      status: ProjectStatus.ACTIVE,
      start_date: new Date('2026-02-01'),
      budget: 8000000,
      actual_cost: 2500000,
      progress_percentage: 45,
      company_id: company.id
    }
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'Sunrise Apartments',
      description: 'Affordable housing project',
      builder_id: adminUser.id,
      manager_id: pmUser.id,
      status: ProjectStatus.ACTIVE,
      start_date: new Date('2026-04-15'),
      budget: 2000000,
      actual_cost: 300000,
      progress_percentage: 20,
      company_id: company.id
    }
  });

  // 4. Create Sites
  const site1 = await prisma.site.create({
    data: {
      name: 'Block A',
      project_id: project1.id,
      supervisor_id: supUser.id,
      status: SiteStatus.IN_PROGRESS,
      location: 'Central Avenue',
      company_id: company.id
    }
  });

  const site2 = await prisma.site.create({
    data: {
      name: 'Phase 1',
      project_id: project2.id,
      supervisor_id: supUser.id,
      status: SiteStatus.IN_PROGRESS,
      location: 'East Suburbs',
      company_id: company.id
    }
  });

  // 5. Create Tasks
  await prisma.task.createMany({
    data: [
      {
        title: 'Roofing installation',
        project_id: project1.id,
        site_id: site1.id,
        assignee_id: supUser.id,
        created_by: pmUser.id,
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        due_date: new Date(Date.now() + 86400000 * 3), // 3 days from now
        company_id: company.id
      },
      {
        title: 'Plumbing first fix',
        project_id: project1.id,
        site_id: site1.id,
        assignee_id: supUser.id,
        created_by: pmUser.id,
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        due_date: new Date(Date.now() + 86400000 * 7), // 7 days from now
        company_id: company.id
      }
    ]
  });

  // 6. Create Workers
  await prisma.worker.createMany({
    data: [
      {
        name: 'Hari Plumber',
        trade: 'Plumber',
        daily_rate: 900,
        status: WorkerStatus.ACTIVE,
        company_id: company.id,
        project_id: project1.id
      },
      {
        name: 'Ram Electrician',
        trade: 'Electrician',
        daily_rate: 1000,
        status: WorkerStatus.ACTIVE,
        company_id: company.id,
        project_id: project1.id
      }
    ]
  });

  // 7. Create Milestones
  await prisma.milestone.createMany({
    data: [
      {
        project_id: project1.id,
        name: 'Foundation Completed',
        description: 'All foundation works and soil testing',
        target_date: new Date(Date.now() + 86400000 * 14),
        status: 'IN_PROGRESS'
      },
      {
        project_id: project1.id,
        name: 'First Floor Slab',
        description: 'Pouring of the first floor slab',
        target_date: new Date(Date.now() + 86400000 * 45),
        status: 'PENDING'
      }
    ]
  });

  // 8. Create Material and Material Request
  const cement = await prisma.material.upsert({
    where: { code: 'CEM-001' },
    update: {},
    create: {
      name: 'Portland Cement (50kg)',
      code: 'CEM-001',
      category: 'Cement',
      unit: 'Bag',
      company_id: company.id
    }
  });

  await prisma.materialRequest.create({
    data: {
      site_id: site1.id,
      material_id: cement.id,
      quantity: 100,
      requested_by: supUser.id,
      status: 'PENDING'
    }
  });

  // 9. Finance data: Expenses and Cashbook
  await prisma.expense.createMany({
    data: [
      {
        amount: 25000,
        category: 'Equipment Rental',
        description: 'Excavator rental for 2 days',
        project_id: project1.id,
        site_id: site1.id,
        user_id: pmUser.id,
        date: new Date(),
        status: 'APPROVED',
        company_id: company.id
      },
      {
        amount: 45000,
        category: 'Labor Advance',
        description: 'Advance payment to concrete workers',
        project_id: project1.id,
        site_id: site1.id,
        user_id: pmUser.id,
        date: new Date(Date.now() - 86400000 * 1),
        status: 'PAID',
        company_id: company.id
      }
    ]
  });

  await prisma.cashbook.createMany({
    data: [
      {
        date: new Date(),
        type: CashbookType.CREDIT,
        amount: 150000,
        description: 'Client Disbursement',
        category: 'Revenue',
        project_id: project1.id,
        recorded_by: adminUser.id,
        company_id: company.id
      },
      {
        date: new Date(Date.now() - 86400000 * 1),
        type: CashbookType.DEBIT,
        amount: 45000,
        description: 'Labor Advance',
        category: 'Labor',
        project_id: project1.id,
        site_id: site1.id,
        recorded_by: adminUser.id,
        company_id: company.id
      }
    ]
  });

  // 10. Worker Attendance
  const workers = await prisma.worker.findMany({ where: { company_id: company.id } });
  if (workers.length > 0) {
    await prisma.workerAttendance.createMany({
      data: workers.map(w => ({
        worker_id: w.id,
        site_id: site1.id,
        date: new Date(),
        status: 'PRESENT',
        marked_by: supUser.id
      }))
    });
  }

  // 11. Activity Log
  await prisma.activityLog.createMany({
    data: [
      {
        user_id: adminUser.id,
        entity_type: 'Project',
        entity_id: project1.id,
        action: 'CREATED',
        company_id: company.id
      },
      {
        user_id: supUser.id,
        entity_type: 'Task',
        entity_id: 'dummy',
        action: 'UPDATED',
        company_id: company.id
      }
    ]
  });

  console.log('Admin builder data seeded successfully.');
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
