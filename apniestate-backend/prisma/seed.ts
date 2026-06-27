import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEFAULT_PERMISSIONS = [
  // Users module
  { module: 'users', action: 'create', description: 'Create users' },
  { module: 'users', action: 'read', description: 'View users' },
  { module: 'users', action: 'update', description: 'Update users' },
  { module: 'users', action: 'delete', description: 'Delete users' },

  // Projects module
  { module: 'projects', action: 'create', description: 'Create projects' },
  { module: 'projects', action: 'read', description: 'View projects' },
  { module: 'projects', action: 'update', description: 'Update projects' },
  { module: 'projects', action: 'delete', description: 'Delete projects' },

  // Sites module
  { module: 'sites', action: 'create', description: 'Create sites' },
  { module: 'sites', action: 'read', description: 'View sites' },
  { module: 'sites', action: 'update', description: 'Update sites' },
  { module: 'sites', action: 'delete', description: 'Delete sites' },

  // Tasks module
  { module: 'tasks', action: 'create', description: 'Create tasks' },
  { module: 'tasks', action: 'read', description: 'View tasks' },
  { module: 'tasks', action: 'update', description: 'Update tasks' },
  { module: 'tasks', action: 'delete', description: 'Delete tasks' },

  // Attendance module
  { module: 'attendance', action: 'create', description: 'Mark attendance' },
  { module: 'attendance', action: 'read', description: 'View attendance' },
  { module: 'attendance', action: 'update', description: 'Update attendance' },

  // Leaves module
  { module: 'leaves', action: 'create', description: 'Apply for leaves' },
  { module: 'leaves', action: 'read', description: 'View leaves' },
  { module: 'leaves', action: 'update', description: 'Update leaves' },
  { module: 'leaves', action: 'approve', description: 'Approve leaves' },

  // Finance module (Expenses)
  { module: 'finance', action: 'create', description: 'Create expenses' },
  { module: 'finance', action: 'read', description: 'View expenses' },
  { module: 'finance', action: 'update', description: 'Update expenses' },
  { module: 'finance', action: 'approve', description: 'Approve expenses' },

  // Invoices module
  { module: 'invoices', action: 'create', description: 'Create invoices' },
  { module: 'invoices', action: 'read', description: 'View invoices' },
  { module: 'invoices', action: 'update', description: 'Update invoices' },
  { module: 'invoices', action: 'delete', description: 'Delete invoices' },

  // Payments module
  { module: 'payments', action: 'create', description: 'Record payments' },
  { module: 'payments', action: 'read', description: 'View payments' },
  { module: 'payments', action: 'update', description: 'Update payments' },
  { module: 'payments', action: 'delete', description: 'Delete payments' },

  // Budgets module
  { module: 'budgets', action: 'create', description: 'Set budgets' },
  { module: 'budgets', action: 'read', description: 'View budgets' },
  { module: 'budgets', action: 'update', description: 'Update budgets' },
  { module: 'budgets', action: 'delete', description: 'Delete budgets' },

  // Inventory module
  { module: 'inventory', action: 'create', description: 'Add inventory items' },
  { module: 'inventory', action: 'read', description: 'View inventory' },
  { module: 'inventory', action: 'update', description: 'Update inventory' },
  { module: 'inventory', action: 'delete', description: 'Delete inventory items' },

  // Material requests module
  { module: 'material-requests', action: 'create', description: 'Request materials' },
  { module: 'material-requests', action: 'read', description: 'View material requests' },
  { module: 'material-requests', action: 'update', description: 'Update material requests' },
  { module: 'material-requests', action: 'approve', description: 'Approve material requests' },

  // Vendors module
  { module: 'vendors', action: 'create', description: 'Create vendors' },
  { module: 'vendors', action: 'read', description: 'View vendors' },
  { module: 'vendors', action: 'update', description: 'Update vendors' },
  { module: 'vendors', action: 'delete', description: 'Delete vendors' },

  // Workers module
  { module: 'workers', action: 'create', description: 'Create workers' },
  { module: 'workers', action: 'read', description: 'View workers' },
  { module: 'workers', action: 'update', description: 'Update workers' },
  { module: 'workers', action: 'delete', description: 'Delete workers' },

  // Contractors module
  { module: 'contractors', action: 'create', description: 'Create contractors' },
  { module: 'contractors', action: 'read', description: 'View contractors' },
  { module: 'contractors', action: 'update', description: 'Update contractors' },
  { module: 'contractors', action: 'delete', description: 'Delete contractors' },

  // Documents module
  { module: 'documents', action: 'create', description: 'Upload documents' },
  { module: 'documents', action: 'read', description: 'View documents' },
  { module: 'documents', action: 'update', description: 'Update documents' },
  { module: 'documents', action: 'delete', description: 'Delete documents' },

  // Reports module
  { module: 'reports', action: 'read', description: 'View reports' },
];

async function seedPermissions() {
  console.log('Seeding default permissions...');

  // 1. Insert permissions in database
  for (const perm of DEFAULT_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { module_action: { module: perm.module, action: perm.action } },
      update: { description: perm.description },
      create: perm,
    });
  }

  // 2. Fetch all permissions from DB
  const dbPerms = await prisma.permission.findMany();

  // Helper to find permission ID
  const getPermId = (mod: string, act: string) => {
    return dbPerms.find((p) => p.module === mod && p.action === act)?.id;
  };

  // Helper to assign role permissions
  const assignRolePermissions = async (role: Role, modActList: { module: string; action: string }[]) => {
    // Clear existing permissions for this role first
    await prisma.rolePermission.deleteMany({
      where: { role },
    });

    const rolePermData = modActList
      .map((ma) => {
        const permission_id = getPermId(ma.module, ma.action);
        return permission_id ? { role, permission_id } : null;
      })
      .filter(Boolean) as { role: Role; permission_id: string }[];

    await prisma.rolePermission.createMany({
      data: rolePermData,
    });
  };

  // 3. Define mapping per Role

  // ADMIN: All permissions
  await assignRolePermissions(Role.ADMIN, DEFAULT_PERMISSIONS.map(p => ({ module: p.module, action: p.action })));

  // BUILDER role permissions
  await assignRolePermissions(Role.BUILDER, [
    { module: 'users', action: 'read' },
    ...DEFAULT_PERMISSIONS.filter((p) => p.module !== 'users').map((p) => ({ module: p.module, action: p.action })),
  ]);

  // PROJECT_MANAGER role permissions
  await assignRolePermissions(Role.PROJECT_MANAGER, [
    { module: 'users', action: 'read' },
    { module: 'projects', action: 'read' },
    { module: 'projects', action: 'update' },
    ...DEFAULT_PERMISSIONS.filter((p) => ['sites', 'tasks', 'attendance', 'leaves', 'finance', 'budgets', 'inventory', 'material-requests', 'workers', 'documents', 'reports'].includes(p.module)).map((p) => ({ module: p.module, action: p.action })),
    { module: 'vendors', action: 'read' },
    { module: 'contractors', action: 'read' },
  ]);

  // SITE_SUPERVISOR role permissions
  await assignRolePermissions(Role.SITE_SUPERVISOR, [
    { module: 'projects', action: 'read' },
    { module: 'projects', action: 'create' },
    { module: 'projects', action: 'update' },
    { module: 'sites', action: 'read' },
    { module: 'sites', action: 'create' },
    { module: 'sites', action: 'update' },
    { module: 'tasks', action: 'read' },
    { module: 'tasks', action: 'create' },
    { module: 'tasks', action: 'update' },
    { module: 'attendance', action: 'create' },
    { module: 'attendance', action: 'read' },
    { module: 'attendance', action: 'update' },
    { module: 'leaves', action: 'create' },
    { module: 'leaves', action: 'read' },
    { module: 'inventory', action: 'read' },
    { module: 'inventory', action: 'create' },
    { module: 'inventory', action: 'update' },
    { module: 'material-requests', action: 'create' },
    { module: 'material-requests', action: 'read' },
    { module: 'workers', action: 'read' },
    { module: 'workers', action: 'create' },
    { module: 'workers', action: 'update' },
    { module: 'finance', action: 'create' },
    { module: 'finance', action: 'read' },
    { module: 'vendors', action: 'read' },
    { module: 'payments', action: 'create' },
    { module: 'payments', action: 'read' },
    { module: 'documents', action: 'create' },
    { module: 'documents', action: 'read' },
    { module: 'reports', action: 'read' },
  ]);

  // ACCOUNTANT role permissions
  await assignRolePermissions(Role.ACCOUNTANT, [
    { module: 'finance', action: 'create' },
    { module: 'finance', action: 'read' },
    { module: 'finance', action: 'update' },
    { module: 'finance', action: 'approve' },
    ...DEFAULT_PERMISSIONS.filter((p) => ['invoices', 'payments'].includes(p.module)).map((p) => ({ module: p.module, action: p.action })),
    { module: 'budgets', action: 'read' },
    { module: 'vendors', action: 'read' },
    { module: 'vendors', action: 'update' },
    { module: 'contractors', action: 'read' },
    { module: 'contractors', action: 'update' },
    { module: 'reports', action: 'read' },
  ]);

  // INVENTORY_MANAGER role permissions
  await assignRolePermissions(Role.INVENTORY_MANAGER, [
    ...DEFAULT_PERMISSIONS.filter((p) => p.module === 'inventory').map((p) => ({ module: p.module, action: p.action })),
    { module: 'material-requests', action: 'read' },
    { module: 'material-requests', action: 'update' },
    { module: 'material-requests', action: 'approve' },
    { module: 'vendors', action: 'read' },
    { module: 'reports', action: 'read' },
  ]);

  console.log('Permissions and role permissions seeded.');
}

async function main() {
  console.log('Seeding the database...');

  // Seed permissions first
  await seedPermissions();

  const company = await prisma.company.upsert({
    where: { id: 'cl_demo_company_1' },
    update: { name: 'Apni Estate Demo' },
    create: {
      id: 'cl_demo_company_1',
      name: 'Apni Estate Demo',
    },
  });
  console.log(`Created/updated demo company: ${company.name}`);

  const commonPassword = await bcrypt.hash('admin123', 10);

  // 1. Admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@apniestate.com' },
    update: { role: Role.ADMIN, company_id: company.id },
    create: {
      name: 'System Admin',
      email: 'admin@apniestate.com',
      password_hash: commonPassword,
      role: Role.ADMIN,
      phone: '+1234567890',
      is_active: true,
      company_id: company.id,
    },
  });
  console.log(`Created admin user: ${admin.email}`);

  // 2. Builder user
  const builder = await prisma.user.upsert({
    where: { email: 'builder@apniestate.com' },
    update: { company_id: company.id },
    create: {
      name: 'Lead Builder',
      email: 'builder@apniestate.com',
      password_hash: commonPassword,
      role: Role.BUILDER,
      phone: '+0987654321',
      is_active: true,
      company_id: company.id,
    },
  });
  console.log(`Created builder user: ${builder.email}`);

  // 3. Project Manager user
  const pm = await prisma.user.upsert({
    where: { email: 'pm@apniestate.com' },
    update: { company_id: company.id },
    create: {
      name: 'Project Manager',
      email: 'pm@apniestate.com',
      password_hash: commonPassword,
      role: Role.PROJECT_MANAGER,
      phone: '+1112223333',
      is_active: true,
      company_id: company.id,
    },
  });
  console.log(`Created project manager user: ${pm.email}`);

  // 4. Supervisor user
  const supervisor = await prisma.user.upsert({
    where: { email: 'supervisor@apniestate.com' },
    update: { company_id: company.id },
    create: {
      name: 'Site Supervisor',
      email: 'supervisor@apniestate.com',
      password_hash: commonPassword,
      role: Role.SITE_SUPERVISOR,
      phone: '+4445556666',
      is_active: true,
      company_id: company.id,
    },
  });
  console.log(`Created site supervisor user: ${supervisor.email}`);

  // 5. Accountant user
  const accountant = await prisma.user.upsert({
    where: { email: 'accountant@apniestate.com' },
    update: { company_id: company.id },
    create: {
      name: 'Accountant User',
      email: 'accountant@apniestate.com',
      password_hash: commonPassword,
      role: Role.ACCOUNTANT,
      phone: '+7778889999',
      is_active: true,
      company_id: company.id,
    },
  });
  console.log(`Created accountant user: ${accountant.email}`);

  // 6. Inventory Manager user
  const inventoryManager = await prisma.user.upsert({
    where: { email: 'inventory@apniestate.com' },
    update: { company_id: company.id },
    create: {
      name: 'Inventory Manager',
      email: 'inventory@apniestate.com',
      password_hash: commonPassword,
      role: Role.INVENTORY_MANAGER,
      phone: '+1212121212',
      is_active: true,
      company_id: company.id,
    },
  });
  console.log(`Created inventory manager user: ${inventoryManager.email}`);

  // Create an initial project
  const project = await prisma.project.upsert({
    where: { id: 'cl_demo_project_1' },
    update: { company_id: company.id },
    create: {
      id: 'cl_demo_project_1',
      name: 'Alpha Tower Construction',
      description: 'A 20-story commercial building in downtown.',
      builder_id: builder.id,
      manager_id: pm.id,
      status: 'ACTIVE',
      start_date: new Date(),
      budget: 15000000,
      address: '123 Alpha St',
      city: 'Metropolis',
      company_id: company.id,
    },
  });
  console.log(`Created demo project: ${project.name}`);

  // Create demo sites
  const site1 = await prisma.site.upsert({
    where: { id: 'cl_demo_site_1' },
    update: { company_id: company.id },
    create: {
      id: 'cl_demo_site_1',
      project_id: project.id,
      name: 'Site A - Foundation and Excavation',
      location: 'South Sector - Metropolis',
      supervisor_id: supervisor.id,
      status: 'IN_PROGRESS',
      progress_percentage: 45,
      phase: 'Foundation',
      company_id: company.id,
    },
  });
  console.log(`Created demo site: ${site1.name}`);

  // Seed default materials
  const materialsData = [
    { id: 'mat_cement', name: 'Cement', unit: 'bags', category: 'Material', description: 'Portland Pozzolana Cement' },
    { id: 'mat_sand', name: 'Sand', unit: 'cft', category: 'Material', description: 'Fine river sand' },
    { id: 'mat_bricks', name: 'Bricks', unit: 'pcs', category: 'Material', description: 'Red clay bricks' },
    { id: 'mat_steel', name: 'Steel Rebar', unit: 'kg', category: 'Material', description: 'TMT Steel rebars' },
    { id: 'mat_pvc_pipes', name: 'PVC Pipes', unit: 'pcs', category: 'Plumbing', description: '3 inch PVC plumbing pipes' },
    { id: 'mat_copper_wire', name: 'Copper Wire', unit: 'meters', category: 'Electrical', description: '1.5 sq mm copper electrical wire' },
    { id: 'mat_paint', name: 'Emulsion Paint', unit: 'liters', category: 'Finishing', description: 'Interior emulsion paint' },
  ];

  for (const mat of materialsData) {
    await prisma.material.upsert({
      where: { id: mat.id },
      update: {
        name: mat.name,
        unit: mat.unit,
        category: mat.category,
        description: mat.description,
        company_id: company.id,
      },
      create: {
        ...mat,
        company_id: company.id,
      },
    });
  }
  console.log('Seeded standard materials');

  // Seed some initial inventory items and transactions
  const inventoryData = [
    { material_id: 'mat_cement', quantity: 150, min_quantity: 50 },
    { material_id: 'mat_sand', quantity: 400, min_quantity: 100 },
    { material_id: 'mat_bricks', quantity: 2000, min_quantity: 500 },
    { material_id: 'mat_steel', quantity: 30, min_quantity: 100 }, // low stock
  ];

  for (const inv of inventoryData) {
    const item = await prisma.inventoryItem.upsert({
      where: {
        material_id_site_id: {
          material_id: inv.material_id,
          site_id: site1.id,
        },
      },
      update: {
        company_id: company.id,
      },
      create: {
        material_id: inv.material_id,
        site_id: site1.id,
        quantity: 0,
        min_quantity: inv.min_quantity,
        company_id: company.id,
      },
    });

    // Create a transaction for initial stock
    // Check if transactions already exist
    const txCount = await prisma.inventoryTransaction.count({
      where: { item_id: item.id }
    });

    if (txCount === 0) {
      await prisma.inventoryTransaction.createMany({
        data: [
          {
            item_id: item.id,
            type: 'IN',
            quantity: inv.quantity,
            notes: 'Initial stock seeding',
            user_id: admin.id,
          },
          // Create an OUT transaction to simulate daily usage
          {
            item_id: item.id,
            type: 'OUT',
            quantity: Math.round(inv.quantity * 0.1),
            notes: 'Daily work usage simulation',
            user_id: supervisor.id,
            created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          }
        ]
      });
    }
  }
  console.log('Seeded inventory items and simulation transactions');

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

