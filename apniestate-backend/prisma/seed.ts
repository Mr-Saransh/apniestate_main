import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ─── Idempotent seed for Apni Estate Demo ────────────────
// Run: npx ts-node prisma/seed.ts
// Idempotent: upserts all records by stable ID
// Full 6-month history: 5 projects, 50+ workers, 90-day attendance,
// 6-month cashbook, all finance modules populated.
// ─────────────────────────────────────────────────────────

const DEFAULT_PERMISSIONS = [
  { module: 'users', action: 'create', description: 'Create users' },
  { module: 'users', action: 'read', description: 'View users' },
  { module: 'users', action: 'update', description: 'Update users' },
  { module: 'users', action: 'delete', description: 'Delete users' },
  { module: 'projects', action: 'create', description: 'Create projects' },
  { module: 'projects', action: 'read', description: 'View projects' },
  { module: 'projects', action: 'update', description: 'Update projects' },
  { module: 'projects', action: 'delete', description: 'Delete projects' },
  { module: 'sites', action: 'create', description: 'Create sites' },
  { module: 'sites', action: 'read', description: 'View sites' },
  { module: 'sites', action: 'update', description: 'Update sites' },
  { module: 'sites', action: 'delete', description: 'Delete sites' },
  { module: 'tasks', action: 'create', description: 'Create tasks' },
  { module: 'tasks', action: 'read', description: 'View tasks' },
  { module: 'tasks', action: 'update', description: 'Update tasks' },
  { module: 'tasks', action: 'delete', description: 'Delete tasks' },
  { module: 'attendance', action: 'create', description: 'Mark attendance' },
  { module: 'attendance', action: 'read', description: 'View attendance' },
  { module: 'attendance', action: 'update', description: 'Update attendance' },
  { module: 'leaves', action: 'create', description: 'Apply for leaves' },
  { module: 'leaves', action: 'read', description: 'View leaves' },
  { module: 'leaves', action: 'update', description: 'Update leaves' },
  { module: 'leaves', action: 'approve', description: 'Approve leaves' },
  { module: 'finance', action: 'create', description: 'Create expenses' },
  { module: 'finance', action: 'read', description: 'View expenses' },
  { module: 'finance', action: 'update', description: 'Update expenses' },
  { module: 'finance', action: 'approve', description: 'Approve expenses' },
  { module: 'invoices', action: 'create', description: 'Create invoices' },
  { module: 'invoices', action: 'read', description: 'View invoices' },
  { module: 'invoices', action: 'update', description: 'Update invoices' },
  { module: 'invoices', action: 'delete', description: 'Delete invoices' },
  { module: 'payments', action: 'create', description: 'Record payments' },
  { module: 'payments', action: 'read', description: 'View payments' },
  { module: 'payments', action: 'update', description: 'Update payments' },
  { module: 'payments', action: 'delete', description: 'Delete payments' },
  { module: 'budgets', action: 'create', description: 'Set budgets' },
  { module: 'budgets', action: 'read', description: 'View budgets' },
  { module: 'budgets', action: 'update', description: 'Update budgets' },
  { module: 'budgets', action: 'delete', description: 'Delete budgets' },
  { module: 'inventory', action: 'create', description: 'Add inventory items' },
  { module: 'inventory', action: 'read', description: 'View inventory' },
  { module: 'inventory', action: 'update', description: 'Update inventory' },
  { module: 'inventory', action: 'delete', description: 'Delete inventory items' },
  { module: 'material-requests', action: 'create', description: 'Request materials' },
  { module: 'material-requests', action: 'read', description: 'View material requests' },
  { module: 'material-requests', action: 'update', description: 'Update material requests' },
  { module: 'material-requests', action: 'approve', description: 'Approve material requests' },
  { module: 'vendors', action: 'create', description: 'Create vendors' },
  { module: 'vendors', action: 'read', description: 'View vendors' },
  { module: 'vendors', action: 'update', description: 'Update vendors' },
  { module: 'vendors', action: 'delete', description: 'Delete vendors' },
  { module: 'workers', action: 'create', description: 'Create workers' },
  { module: 'workers', action: 'read', description: 'View workers' },
  { module: 'workers', action: 'update', description: 'Update workers' },
  { module: 'workers', action: 'delete', description: 'Delete workers' },
  { module: 'contractors', action: 'create', description: 'Create contractors' },
  { module: 'contractors', action: 'read', description: 'View contractors' },
  { module: 'contractors', action: 'update', description: 'Update contractors' },
  { module: 'contractors', action: 'delete', description: 'Delete contractors' },
  { module: 'documents', action: 'create', description: 'Upload documents' },
  { module: 'documents', action: 'read', description: 'View documents' },
  { module: 'documents', action: 'update', description: 'Update documents' },
  { module: 'documents', action: 'delete', description: 'Delete documents' },
  { module: 'reports', action: 'read', description: 'View reports' },
];

async function seedPermissions() {
  console.log('📋 Seeding permissions...');
  for (const perm of DEFAULT_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { module_action: { module: perm.module, action: perm.action } },
      update: { description: perm.description },
      create: perm,
    });
  }

  const dbPerms = await prisma.permission.findMany();
  const getPermId = (mod: string, act: string) =>
    dbPerms.find((p) => p.module === mod && p.action === act)?.id;

  const assignRolePermissions = async (role: Role, modActList: { module: string; action: string }[]) => {
    await prisma.rolePermission.deleteMany({ where: { role } });
    const data = modActList
      .map((ma) => {
        const permission_id = getPermId(ma.module, ma.action);
        return permission_id ? { role, permission_id } : null;
      })
      .filter(Boolean) as { role: Role; permission_id: string }[];
    await prisma.rolePermission.createMany({ data });
  };

  await assignRolePermissions(Role.ADMIN, DEFAULT_PERMISSIONS.map(p => ({ module: p.module, action: p.action })));
  await assignRolePermissions(Role.BUILDER, DEFAULT_PERMISSIONS.map(p => ({ module: p.module, action: p.action })));
  await assignRolePermissions(Role.PROJECT_MANAGER, [
    { module: 'users', action: 'read' },
    { module: 'projects', action: 'read' }, { module: 'projects', action: 'update' },
    ...DEFAULT_PERMISSIONS.filter(p => ['sites', 'tasks', 'attendance', 'leaves', 'finance', 'budgets', 'inventory', 'material-requests', 'workers', 'documents', 'reports'].includes(p.module)).map(p => ({ module: p.module, action: p.action })),
    { module: 'vendors', action: 'read' }, { module: 'contractors', action: 'read' },
  ]);
  await assignRolePermissions(Role.SITE_SUPERVISOR, [
    { module: 'projects', action: 'read' }, { module: 'projects', action: 'create' }, { module: 'projects', action: 'update' },
    { module: 'sites', action: 'read' }, { module: 'sites', action: 'create' }, { module: 'sites', action: 'update' },
    { module: 'tasks', action: 'read' }, { module: 'tasks', action: 'create' }, { module: 'tasks', action: 'update' },
    { module: 'attendance', action: 'create' }, { module: 'attendance', action: 'read' }, { module: 'attendance', action: 'update' },
    { module: 'leaves', action: 'create' }, { module: 'leaves', action: 'read' },
    { module: 'inventory', action: 'read' }, { module: 'inventory', action: 'create' }, { module: 'inventory', action: 'update' },
    { module: 'material-requests', action: 'create' }, { module: 'material-requests', action: 'read' },
    { module: 'workers', action: 'read' }, { module: 'workers', action: 'create' }, { module: 'workers', action: 'update' },
    { module: 'finance', action: 'create' }, { module: 'finance', action: 'read' },
    { module: 'vendors', action: 'read' },
    { module: 'payments', action: 'create' }, { module: 'payments', action: 'read' },
    { module: 'documents', action: 'create' }, { module: 'documents', action: 'read' },
    { module: 'reports', action: 'read' },
  ]);
  await assignRolePermissions(Role.ACCOUNTANT, [
    { module: 'finance', action: 'create' }, { module: 'finance', action: 'read' }, { module: 'finance', action: 'update' }, { module: 'finance', action: 'approve' },
    ...DEFAULT_PERMISSIONS.filter(p => ['invoices', 'payments'].includes(p.module)).map(p => ({ module: p.module, action: p.action })),
    { module: 'budgets', action: 'read' },
    { module: 'vendors', action: 'read' }, { module: 'vendors', action: 'update' },
    { module: 'contractors', action: 'read' }, { module: 'contractors', action: 'update' },
    { module: 'reports', action: 'read' },
  ]);
  await assignRolePermissions(Role.INVENTORY_MANAGER, [
    ...DEFAULT_PERMISSIONS.filter(p => p.module === 'inventory').map(p => ({ module: p.module, action: p.action })),
    { module: 'material-requests', action: 'read' }, { module: 'material-requests', action: 'update' }, { module: 'material-requests', action: 'approve' },
    { module: 'vendors', action: 'read' },
    { module: 'reports', action: 'read' },
  ]);

  console.log('✅ Permissions seeded');
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function monthsAgo(n: number, day = 1): Date {
  const d = new Date();
  d.setDate(day);
  d.setMonth(d.getMonth() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function monthsFromNow(n: number, day = 1): Date {
  const d = new Date();
  d.setDate(day);
  d.setMonth(d.getMonth() + n);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function main() {
  console.log('🚀 Seeding Apni Estate Demo...');
  await seedPermissions();

  // ── Company 1: Premium (₹100,000 Plan) ─────────────────
  const company = await prisma.company.upsert({
    where: { id: 'cl_demo_company_1' },
    update: { name: 'Apni Estate Demo (Premium)' },
    create: { id: 'cl_demo_company_1', name: 'Apni Estate Demo (Premium)' },
  });
  console.log(`🏢 Premium Company: ${company.name}`);

  // Premium Subscription (₹1,00,000 Plan, Forever Demo, CRM Included, Unlimited Projects)
  await prisma.subscription.upsert({
    where: { id: 'sub_demo_premium_100k' },
    update: {
      company_id: company.id,
      plan: 'PLAN_100K',
      duration_months: 12,
      price: 1200000,
      status: 'ACTIVE',
      is_demo: true,
      start_date: monthsAgo(6),
      end_date: monthsFromNow(60),
    },
    create: {
      id: 'sub_demo_premium_100k',
      company_id: company.id,
      plan: 'PLAN_100K',
      duration_months: 12,
      price: 1200000,
      currency: 'INR',
      status: 'ACTIVE',
      is_demo: true,
      type: 'PAID',
      start_date: monthsAgo(6),
      end_date: monthsFromNow(60),
      starts_at: monthsAgo(6),
      expires_at: monthsFromNow(60),
    },
  });

  // ── Company 2: Starter (₹30,000 Plan) ───────────────────
  const starterCompany = await prisma.company.upsert({
    where: { id: 'cl_demo_starter_co' },
    update: { name: 'Starter Builders Pvt Ltd' },
    create: { id: 'cl_demo_starter_co', name: 'Starter Builders Pvt Ltd' },
  });
  console.log(`🏢 Starter Company: ${starterCompany.name}`);

  // Starter Subscription (₹30,000 Plan, Forever Demo, Max 1 Project, CRM Disabled)
  await prisma.subscription.upsert({
    where: { id: 'sub_demo_starter_30k' },
    update: {
      company_id: starterCompany.id,
      plan: 'PLAN_30K',
      duration_months: 12,
      price: 360000,
      status: 'ACTIVE',
      is_demo: true,
      start_date: monthsAgo(3),
      end_date: monthsFromNow(60),
    },
    create: {
      id: 'sub_demo_starter_30k',
      company_id: starterCompany.id,
      plan: 'PLAN_30K',
      duration_months: 12,
      price: 360000,
      currency: 'INR',
      status: 'ACTIVE',
      is_demo: true,
      type: 'PAID',
      start_date: monthsAgo(3),
      end_date: monthsFromNow(60),
      starts_at: monthsAgo(3),
      expires_at: monthsFromNow(60),
    },
  });

  // ── Company 3: Growth (₹50,000 Plan) ────────────────────
  const growthCompany = await prisma.company.upsert({
    where: { id: 'cl_demo_growth_co' },
    update: { name: 'Growth Infra Ltd' },
    create: { id: 'cl_demo_growth_co', name: 'Growth Infra Ltd' },
  });
  console.log(`🏢 Growth Company: ${growthCompany.name}`);

  // Growth Subscription (₹50,000 Plan, Forever Demo, Max 3 Projects, CRM Disabled)
  await prisma.subscription.upsert({
    where: { id: 'sub_demo_growth_50k' },
    update: {
      company_id: growthCompany.id,
      plan: 'PLAN_50K',
      duration_months: 12,
      price: 600000,
      status: 'ACTIVE',
      is_demo: true,
      start_date: monthsAgo(4),
      end_date: monthsFromNow(60),
    },
    create: {
      id: 'sub_demo_growth_50k',
      company_id: growthCompany.id,
      plan: 'PLAN_50K',
      duration_months: 12,
      price: 600000,
      currency: 'INR',
      status: 'ACTIVE',
      is_demo: true,
      type: 'PAID',
      start_date: monthsAgo(4),
      end_date: monthsFromNow(60),
      starts_at: monthsAgo(4),
      expires_at: monthsFromNow(60),
    },
  });

  const pass = await bcrypt.hash('admin123', 10);
  const starterPass = await bcrypt.hash('starter123', 10);
  const growthPass = await bcrypt.hash('growth123', 10);

  // ── Users ────────────────────────────────────────────────
  // Demo 1: Premium Builder (admin@gmail.com / admin123)
  const builder = await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: { role: Role.BUILDER, company_id: company.id, name: 'Aditya Sharma', phone: '+91-9820112233', city: 'Mumbai', state: 'Maharashtra', is_active: true, subscription_status: 'ACTIVE', onboarded: true },
    create: { name: 'Aditya Sharma', email: 'admin@gmail.com', password_hash: pass, role: Role.BUILDER, phone: '+91-9820112233', city: 'Mumbai', state: 'Maharashtra', is_active: true, company_id: company.id, subscription_status: 'ACTIVE', onboarded: true },
  });

  // Demo 2: Starter Builder (starter@apniestate.com / starter123)
  const starterBuilder = await prisma.user.upsert({
    where: { email: 'starter@apniestate.com' },
    update: { role: Role.BUILDER, company_id: starterCompany.id, name: 'Suresh Patel', phone: '+91-9876543210', city: 'Gurugram', state: 'Haryana', is_active: true, subscription_status: 'ACTIVE', onboarded: true },
    create: { name: 'Suresh Patel', email: 'starter@apniestate.com', password_hash: starterPass, role: Role.BUILDER, phone: '+91-9876543210', city: 'Gurugram', state: 'Haryana', is_active: true, company_id: starterCompany.id, subscription_status: 'ACTIVE', onboarded: true },
  });

  // Demo 3: Growth Builder (growth@apniestate.com / growth123)
  const growthBuilder = await prisma.user.upsert({
    where: { email: 'growth@apniestate.com' },
    update: { role: Role.BUILDER, company_id: growthCompany.id, name: 'Gaurav Singhal', phone: '+91-9876543220', city: 'Noida', state: 'Uttar Pradesh', is_active: true, subscription_status: 'ACTIVE', onboarded: true },
    create: { name: 'Gaurav Singhal', email: 'growth@apniestate.com', password_hash: growthPass, role: Role.BUILDER, phone: '+91-9876543220', city: 'Noida', state: 'Uttar Pradesh', is_active: true, company_id: growthCompany.id, subscription_status: 'ACTIVE', onboarded: true },
  });

  // Also keep original builder account for backward compat
  const builderAlt = await prisma.user.upsert({
    where: { email: 'builder@apniestate.com' },
    update: { company_id: company.id, name: 'Aditya Sharma (Alt)', phone: '+91-9820112234', subscription_status: 'ACTIVE' },
    create: { name: 'Aditya Sharma (Alt)', email: 'builder@apniestate.com', password_hash: pass, role: Role.BUILDER, phone: '+91-9820112234', is_active: true, company_id: company.id, subscription_status: 'ACTIVE' },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@apniestate.com' },
    update: { role: Role.ADMIN, company_id: company.id, name: 'System Admin' },
    create: { name: 'System Admin', email: 'admin@apniestate.com', password_hash: pass, role: Role.ADMIN, is_active: true, company_id: company.id },
  });

  const pm1 = await prisma.user.upsert({
    where: { email: 'pm1@apniestate.com' },
    update: { company_id: company.id, name: 'Rohan Mehra', phone: '+91-9820223344' },
    create: { name: 'Rohan Mehra', email: 'pm1@apniestate.com', password_hash: pass, role: Role.PROJECT_MANAGER, phone: '+91-9820223344', is_active: true, company_id: company.id },
  });

  const pm2 = await prisma.user.upsert({
    where: { email: 'pm2@apniestate.com' },
    update: { company_id: company.id, name: 'Pooja Iyer', phone: '+91-9820334455' },
    create: { name: 'Pooja Iyer', email: 'pm2@apniestate.com', password_hash: pass, role: Role.PROJECT_MANAGER, phone: '+91-9820334455', is_active: true, company_id: company.id },
  });

  const sup1 = await prisma.user.upsert({
    where: { email: 'sup1@apniestate.com' },
    update: { company_id: company.id, name: 'Vikram Joshi', phone: '+91-9820445566' },
    create: { name: 'Vikram Joshi', email: 'sup1@apniestate.com', password_hash: pass, role: Role.SITE_SUPERVISOR, phone: '+91-9820445566', is_active: true, company_id: company.id },
  });

  const sup2 = await prisma.user.upsert({
    where: { email: 'sup2@apniestate.com' },
    update: { company_id: company.id, name: 'Amitabh Gupta', phone: '+91-9820556677' },
    create: { name: 'Amitabh Gupta', email: 'sup2@apniestate.com', password_hash: pass, role: Role.SITE_SUPERVISOR, phone: '+91-9820556677', is_active: true, company_id: company.id },
  });

  const sup3 = await prisma.user.upsert({
    where: { email: 'sup3@apniestate.com' },
    update: { company_id: company.id, name: 'Suresh Rao', phone: '+91-9820667788' },
    create: { name: 'Suresh Rao', email: 'sup3@apniestate.com', password_hash: pass, role: Role.SITE_SUPERVISOR, phone: '+91-9820667788', is_active: true, company_id: company.id },
  });

  const accountant = await prisma.user.upsert({
    where: { email: 'accounts@apniestate.com' },
    update: { company_id: company.id, name: 'Neha Kulkarni', phone: '+91-9820778899' },
    create: { name: 'Neha Kulkarni', email: 'accounts@apniestate.com', password_hash: pass, role: Role.ACCOUNTANT, phone: '+91-9820778899', is_active: true, company_id: company.id },
  });

  console.log('👥 Users seeded');

  // Ensure memberships for all users
  const allUsers = [builder, builderAlt, admin, pm1, pm2, sup1, sup2, sup3, accountant];
  for (const u of allUsers) {
    await prisma.companyMembership.upsert({
      where: { user_id_company_id: { user_id: u.id, company_id: company.id } },
      update: { status: 'ACTIVE' },
      create: { user_id: u.id, company_id: company.id, roles: [u.role], status: 'ACTIVE' },
    });
  }

  // Memberships for Starter and Growth
  await prisma.companyMembership.upsert({
    where: { user_id_company_id: { user_id: starterBuilder.id, company_id: starterCompany.id } },
    update: { status: 'ACTIVE' },
    create: { user_id: starterBuilder.id, company_id: starterCompany.id, roles: [Role.BUILDER], status: 'ACTIVE' },
  });

  await prisma.companyMembership.upsert({
    where: { user_id_company_id: { user_id: growthBuilder.id, company_id: growthCompany.id } },
    update: { status: 'ACTIVE' },
    create: { user_id: growthBuilder.id, company_id: growthCompany.id, roles: [Role.BUILDER], status: 'ACTIVE' },
  });

  console.log('🤝 Memberships ensured');

  // ── Vendors ─────────────────────────────────────────────
  const vendors = [
    { id: 'vend_cement_co', name: 'UltraTech Cement Distributors', type: 'MATERIAL_SUPPLIER', contact_person: 'Rajesh Agarwal', phone: '+91-22-28765432', email: 'sales@ultratech-dist.in', category: 'Cement' },
    { id: 'vend_steel_co', name: 'Tata Tiscon Steel Hub', type: 'MATERIAL_SUPPLIER', contact_person: 'Sunil Verma', phone: '+91-22-27891234', email: 'orders@tatasteel-hub.in', category: 'Steel' },
    { id: 'vend_aggregate', name: 'Deccan Aggregates & Stone Crusher', type: 'MATERIAL_SUPPLIER', contact_person: 'Harish Patil', phone: '+91-20-23456789', email: 'info@deccanaggregates.in', category: 'Aggregates' },
    { id: 'vend_brick_co', name: 'Bharat Red Brick Works', type: 'MATERIAL_SUPPLIER', contact_person: 'Anil Deshmukh', phone: '+91-22-24456789', email: 'sales@bharatbricks.in', category: 'Bricks' },
    { id: 'vend_crane_co', name: 'Shree Ram Heavy Cranes & Equipment', type: 'EQUIPMENT_VENDOR', contact_person: 'Tarun Mishra', phone: '+91-9820998877', email: 'info@shreeramcranes.in', category: 'Equipment' },
  ];

  for (const v of vendors) {
    await prisma.vendor.upsert({
      where: { id: v.id },
      update: { ...v, company_id: company.id } as any,
      create: { ...v, is_active: true, company_id: company.id } as any,
    });
  }
  console.log('🏭 Vendors seeded');

  // ── Materials ────────────────────────────────────────────
  const materials = [
    { id: 'mat_cement', name: 'OPC Cement', unit: 'bags', category: 'Structural', description: 'Ordinary Portland Cement 53 grade', preferred_vendor_id: 'vend_cement_co' },
    { id: 'mat_sand', name: 'Fine Sand', unit: 'cft', category: 'Structural', description: 'River sand for mortar and plaster' },
    { id: 'mat_bricks', name: 'Red Clay Bricks', unit: 'pcs', category: 'Masonry', description: '9×4.5×3 inch fired clay bricks', preferred_vendor_id: 'vend_brick_co' },
    { id: 'mat_steel_rebar', name: 'TMT Steel Rebar', unit: 'kg', category: 'Structural', description: '12mm and 16mm TMT rebars', preferred_vendor_id: 'vend_steel_co' },
    { id: 'mat_aggregate', name: 'Coarse Aggregate', unit: 'cft', category: 'Structural', description: '20mm crushed stone aggregate', preferred_vendor_id: 'vend_aggregate' },
    { id: 'mat_pvc_pipes', name: 'PVC Pipes 3"', unit: 'pcs', category: 'Plumbing', description: '3 inch schedule 40 PVC pipes' },
    { id: 'mat_copper_wire', name: 'Copper Wire 2.5sqmm', unit: 'meters', category: 'Electrical', description: '2.5 sq mm copper electrical wire' },
    { id: 'mat_emulsion_paint', name: 'Emulsion Paint', unit: 'liters', category: 'Finishing', description: 'Interior vinyl emulsion paint' },
    { id: 'mat_tiles', name: 'Ceramic Floor Tiles', unit: 'sqft', category: 'Finishing', description: '2×2 ft ceramic tiles 300gsm' },
    { id: 'mat_shuttering', name: 'Shuttering Plywood', unit: 'sheets', category: 'Formwork', description: '18mm IS:710 grade shuttering ply' },
  ];

  for (const m of materials) {
    await prisma.material.upsert({
      where: { id: m.id },
      update: { company_id: company.id },
      create: { ...m, status: 'ACTIVE', min_stock: 50, reorder_level: 100, max_stock: 1000, company_id: company.id } as any,
    });
  }
  console.log('📦 Materials seeded');

  // ── Projects (Flagship) ──────────────────────────────────
  const projectsData = [
    { id: 'proj_downtown_plaza', name: 'Downtown Commercial Plaza', description: 'A 12-story G+11 premium commercial IT & business park', builder_id: builder.id, manager_id: pm1.id, status: 'ACTIVE', start_date: monthsAgo(6), end_date: monthsFromNow(6), budget: 85000000, address: 'Bandra Kurla Complex (BKC), G Block', city: 'Mumbai', progress_percentage: 68 },
  ];

  const projects: any[] = [];
  for (const p of projectsData) {
    const proj = await prisma.project.upsert({
      where: { id: p.id },
      update: { company_id: company.id, name: p.name, description: p.description, address: p.address, city: p.city, progress_percentage: p.progress_percentage },
      create: { ...p, company_id: company.id } as any,
    });
    projects.push(proj);
  }
  console.log('🏗️ Projects seeded');

  // ── Sites ─────────────────────────────────────────────────
  const sitesData = [
    { id: 'site_dp_tower', project_id: 'proj_downtown_plaza', name: 'Downtown Plaza — Tower Block', location: 'BKC, Bandra East, Mumbai', supervisor_id: sup1.id, status: 'IN_PROGRESS', progress_percentage: 72, phase: 'Superstructure' },
    { id: 'site_dp_basement', project_id: 'proj_downtown_plaza', name: 'Downtown Plaza — Basement & Parking', location: 'BKC, Bandra East, Mumbai', supervisor_id: sup2.id, status: 'IN_PROGRESS', progress_percentage: 95, phase: 'Finishing' },
  ];

  const sites: any[] = [];
  for (const s of sitesData) {
    const site = await prisma.site.upsert({
      where: { id: s.id },
      update: { company_id: company.id, name: s.name, location: s.location },
      create: { ...s, company_id: company.id } as any,
    });
    sites.push(site);
  }
  console.log('📍 Sites seeded');

  // ── Milestones ────────────────────────────────────────────
  const milestonesData = [
    // Downtown Plaza
    { id: 'ms_dp_1', project_id: 'proj_downtown_plaza', name: 'Foundation Complete', target_date: monthsAgo(4), status: 'COMPLETED' },
    { id: 'ms_dp_2', project_id: 'proj_downtown_plaza', name: 'Ground Floor Slab', target_date: monthsAgo(2), status: 'COMPLETED' },
    { id: 'ms_dp_3', project_id: 'proj_downtown_plaza', name: '5th Floor Slab', target_date: daysAgo(15), status: 'COMPLETED' },
    { id: 'ms_dp_4', project_id: 'proj_downtown_plaza', name: 'Roof Slab', target_date: monthsFromNow(2), status: 'IN_PROGRESS' },
    { id: 'ms_dp_5', project_id: 'proj_downtown_plaza', name: 'MEP Rough-In Complete', target_date: monthsFromNow(4), status: 'PENDING' },
    { id: 'ms_dp_6', project_id: 'proj_downtown_plaza', name: 'Handover', target_date: monthsFromNow(6), status: 'PENDING' },
  ];

  for (const ms of milestonesData) {
    await prisma.milestone.upsert({
      where: { id: ms.id },
      update: { status: ms.status as any },
      create: ms as any,
    });
  }
  console.log('🏁 Milestones seeded');

  // ── Workers (52 workers) ─────────────────────────────────
  const workerTrades = ['Mason', 'Steel Fixer', 'Carpenter', 'Plumber', 'Electrician', 'Painter', 'Helper', 'Welder', 'Tile Layer', 'Plasterer'];
  const workerNames = [
    'Ramesh Kumar', 'Suresh Sharma', 'Mahesh Verma', 'Dinesh Gupta', 'Mukesh Yadav', 'Rajesh Patel', 'Ganesh Joshi', 'Rakesh Singh', 'Naresh Pandey', 'Pankaj Mishra',
    'Santosh Chauhan', 'Manoj Tiwari', 'Sunil Saini', 'Anil Rawat', 'Deepak Maurya', 'Vinod Prajapati', 'Ajay Thakur', 'Vijay Rathore', 'Ashok Bind', 'Kishore Sonkar',
    'Brijesh Paswan', 'Dharmendra Gautam', 'Ram Sevak', 'Shiv Kumar', 'Gopal Das', 'Harish Chandra', 'Kishan Lal', 'Mohan Lal', 'Bhola Nath', 'Shyam Sundar',
    'Jagdish Prasad', 'Om Prakash', 'Radhey Shyam', 'Chandra Prakash', 'Suraj Pal', 'Hemant Kumar', 'Kundan Singh', 'Lalit Mohan', 'Devendra Kumar', 'Pravin Shinde',
    'Sanjay Kamble', 'Nitin Gaikwad', 'Sachin More', 'Rahul Jadhav', 'Vikas Sawant', 'Pradeep Pawar', 'Sandip Kadam', 'Kiran Shirodkar', 'Amol Deshpande', 'Girish Kulkarni',
    'Tushar Joshi', 'Vishal Mane'
  ];

  const workerDailyRates: Record<string, number> = {
    'Mason': 1200, 'Steel Fixer': 1100, 'Carpenter': 1000, 'Plumber': 900, 'Electrician': 950,
    'Painter': 800, 'Helper': 600, 'Welder': 1050, 'Tile Layer': 850, 'Plasterer': 900,
  };

  const siteIds = sites.map(s => s.id);
  const createdWorkers: any[] = [];

  for (let i = 0; i < workerNames.length; i++) {
    const trade = workerTrades[i % workerTrades.length];
    const siteId = siteIds[i % siteIds.length];
    const dailyRate = workerDailyRates[trade] + Math.floor(Math.random() * 200);

    const worker = await prisma.worker.upsert({
      where: { id: `worker_${String(i).padStart(3, '0')}` },
      update: { name: workerNames[i], phone: `+91-${9800000000 + i * 179}`, company: { connect: { id: company.id } } },
      create: {
        id: `worker_${String(i).padStart(3, '0')}`,
        name: workerNames[i],
        trade,
        daily_rate: dailyRate,
        site: { connect: { id: siteId } },
        phone: `+91-${9800000000 + i * 179}`,
        is_active: true,
        company: { connect: { id: company.id } },
        status: 'ACTIVE',
        date_of_joining: daysAgo(90 + i),
      },
    });
    createdWorkers.push({ ...worker, site_id: siteId });
  }
  console.log(`👷 ${createdWorkers.length} Workers seeded`);

  // ── Attendance (90 days) ─────────────────────────────────
  console.log('📅 Seeding attendance (90 days)...');
  const attendanceData: any[] = [];
  for (let day = 89; day >= 0; day--) {
    const date = daysAgo(day);
    if (date.getDay() === 0) continue; // Skip Sundays

    // Seed for first 15 workers per day
    const workersToAttend = createdWorkers.slice(0, 15);
    for (const w of workersToAttend) {
      const isPresent = Math.random() > 0.12; // 88% attendance rate
      attendanceData.push({
        worker_id: w.id,
        site_id: w.site_id,
        date,
        status: isPresent ? 'PRESENT' : 'ABSENT',
        daily_wage_snapshot: isPresent ? w.daily_rate : 0,
        marked_by: sup1.id,
      });
    }
  }
  if (attendanceData.length > 0) {
    await prisma.workerAttendance.createMany({
      data: attendanceData,
      skipDuplicates: true,
    });
  }
  console.log('✅ Attendance seeded');

  // ── Budgets ───────────────────────────────────────────────
  for (const p of projects) {
    const totalBudget = p.budget || 50000000;
    const budgetCategories = ["MATERIALS", "LABOUR", "EQUIPMENT"];
    const allocations = [0.60, 0.25, 0.15];

    for (let i = 0; i < budgetCategories.length; i++) {
      const budgetId = `budget_${p.id}_${budgetCategories[i]}`;
      const allocated = Math.round(totalBudget * allocations[i]);
      const spent = Math.round(allocated * (p.progress_percentage / 100) * (0.80 + Math.random() * 0.30));
      await prisma.budget.upsert({
        where: { id: budgetId },
        update: { allocated, spent },
        create: {
          id: budgetId,
          project_id: p.id,
          category: budgetCategories[i] as any,
          allocated,
          spent: Math.min(spent, allocated),
          description: `${budgetCategories[i]} budget for ${p.name}`,
          created_by: builder.id,
          company_id: company.id,
        },
      });
    }
  }
  console.log('💰 Budgets seeded');

  // ── Cashbook (6 months) ──────────────────────────────────
  console.log('📒 Seeding 6 months cashbook...');
  const cashCategories = ['Labour', 'Materials', 'Equipment Hire', 'Overhead', 'Client Payment', 'Misc'];
  let cbCount = 0;
  for (let monthOffset = 5; monthOffset >= 0; monthOffset--) {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setMonth(monthStart.getMonth() - monthOffset);
    monthStart.setHours(0, 0, 0, 0);

    // Monthly client receipt (CREDIT)
    for (const p of projects.slice(0, 3)) {
      const cbId = `cb_credit_${p.id}_${monthOffset}`;
      const existingCb = await prisma.cashbook.findFirst({ where: { id: cbId } });
      if (!existingCb) {
        await prisma.cashbook.create({
          data: {
            id: cbId,
            date: monthStart,
            type: 'CREDIT',
            amount: Math.round(3000000 + Math.random() * 5000000),
            description: `Client payment installment — ${p.name}`,
            category: 'Client Payment',
            project_id: p.id,
            recorded_by: accountant.id,
            company_id: company.id,
          } as any
        });
        cbCount++;
      }

      // Monthly expenses (DEBIT)
      for (let w = 0; w < 3; w++) {
        const expDate = new Date(monthStart);
        expDate.setDate(5 + w * 8);
        const cbDebitId = `cb_debit_${p.id}_${monthOffset}_${w}`;
        const existingDebit = await prisma.cashbook.findFirst({ where: { id: cbDebitId } });
        if (!existingDebit) {
          await prisma.cashbook.create({
            data: {
              id: cbDebitId,
              date: expDate,
              type: 'DEBIT',
              amount: Math.round(500000 + Math.random() * 2000000),
              description: `${cashCategories[w % cashCategories.length]} expenses — ${p.name}`,
              category: cashCategories[w % cashCategories.length],
              project_id: p.id,
              recorded_by: accountant.id,
              company_id: company.id,
            } as any
          });
          cbCount++;
        }
      }
    }
  }
  console.log(`📒 ${cbCount} Cashbook entries seeded`);

  // ── Expenses ──────────────────────────────────────────────
  const expenseCategories = ['Labour', 'Cement', 'Steel', 'Aggregate', 'Equipment Fuel', 'Office', 'Transport', 'Safety'];
  let expCount = 0;
  for (let day = 89; day >= 0; day -= 5) {
    const date = daysAgo(day);
    const project = projects[day % projects.length];
    const site = sites[(day * 3) % sites.length];
    const category = expenseCategories[day % expenseCategories.length];
    const expId = `exp_${project.id}_${day}`;
    const existing = await prisma.expense.findFirst({ where: { id: expId } });
    if (!existing) {
      await prisma.expense.create({
        data: {
          id: expId,
          amount: Math.round(50000 + Math.random() * 400000),
          category,
          description: `${category} purchase for ${site.name}`,
          site_id: site.id,
          project_id: project.id,
          user_id: [sup1.id, sup2.id, sup3.id][day % 3],
          date,
          status: day > 10 ? 'APPROVED' : 'PENDING',
          company_id: company.id,
        } as any
      });
      expCount++;
    }
  }
  console.log(`🧾 ${expCount} Expenses seeded`);

  // ── Inventory (per site) ─────────────────────────────────
  const matInventoryData = [
    { material_id: 'mat_cement', min_quantity: 200 },
    { material_id: 'mat_steel_rebar', min_quantity: 500 },
    { material_id: 'mat_bricks', min_quantity: 5000 },
    { material_id: 'mat_sand', min_quantity: 300 },
    { material_id: 'mat_aggregate', min_quantity: 200 },
    { material_id: 'mat_shuttering', min_quantity: 50 },
  ];

  for (const site of sites.slice(0, 5)) {
    for (const mat of matInventoryData) {
      const existingInv = await prisma.inventoryItem.findUnique({
        where: { material_id_site_id: { material_id: mat.material_id, site_id: site.id } }
      });
      if (!existingInv) {
        // Make some items below minimum (for alerts)
        const isBelowMin = Math.random() < 0.25;
        const quantity = isBelowMin
          ? Math.floor(mat.min_quantity * 0.4 * Math.random())
          : Math.floor(mat.min_quantity * (1.2 + Math.random() * 2));

        const item = await prisma.inventoryItem.create({
          data: {
            material_id: mat.material_id,
            site_id: site.id,
            quantity: 0,
            min_quantity: mat.min_quantity,
            company_id: company.id,
          } as any
        });

        // Initial stock-in transaction
        await prisma.inventoryTransaction.create({
          data: {
            item_id: item.id,
            type: 'IN',
            quantity,
            notes: 'Initial stock — seed data',
            user_id: admin.id,
            created_at: daysAgo(60),
          } as any
        });

        // Usage transactions over time
        const usagePerDay = Math.floor(quantity / 60);
        if (usagePerDay > 0) {
          await prisma.inventoryTransaction.create({
            data: {
              item_id: item.id,
              type: 'OUT',
              quantity: Math.floor(usagePerDay * 30),
              notes: 'Daily consumption — 30 days',
              user_id: sup1.id,
              created_at: daysAgo(30),
            } as any
          });
        }
      }
    }
  }
  console.log('📦 Inventory seeded');

  // ── Purchase Orders ───────────────────────────────────────
  const poData = [
    { id: 'po_001', po_number: 'PO-2026-001', vendor_id: 'vend_cement_co', project_id: 'proj_downtown_plaza', site_id: 'site_dp_tower', status: 'DELIVERED', total_amount: 1800000, delivery_date: daysAgo(20) },
    { id: 'po_002', po_number: 'PO-2026-002', vendor_id: 'vend_steel_co', project_id: 'proj_downtown_plaza', site_id: 'site_dp_tower', status: 'DELIVERED', total_amount: 3500000, delivery_date: daysAgo(15) },
    { id: 'po_003', po_number: 'PO-2026-003', vendor_id: 'vend_brick_co', project_id: 'proj_gulshan_residency', site_id: 'site_gr_tower1', status: 'APPROVED', total_amount: 950000, delivery_date: daysAgo(5) },
    { id: 'po_004', po_number: 'PO-2026-004', vendor_id: 'vend_aggregate', project_id: 'proj_gulshan_residency', site_id: 'site_gr_tower2', status: 'PENDING', total_amount: 750000, delivery_date: monthsFromNow(1) },
    { id: 'po_005', po_number: 'PO-2026-005', vendor_id: 'vend_crane_co', project_id: 'proj_clifton_heights', site_id: 'site_clifton_core', status: 'DRAFT', total_amount: 2200000, delivery_date: monthsFromNow(2) },
    { id: 'po_006', po_number: 'PO-2026-006', vendor_id: 'vend_cement_co', project_id: 'proj_bahria_commercial', site_id: 'site_bahria_main', status: 'DELIVERED', total_amount: 1350000, delivery_date: daysAgo(30) },
    { id: 'po_007', po_number: 'PO-2026-007', vendor_id: 'vend_steel_co', project_id: 'proj_dha_villas', site_id: 'site_dha_block_a', status: 'DELIVERED', total_amount: 2800000, delivery_date: daysAgo(45) },
    { id: 'po_008', po_number: 'PO-2026-008', vendor_id: 'vend_aggregate', project_id: 'proj_downtown_plaza', site_id: 'site_dp_tower', status: 'APPROVED', total_amount: 620000, delivery_date: monthsFromNow(1) },
  ];

  for (const po of poData) {
    await prisma.purchaseOrder.upsert({
      where: { id: po.id },
      update: {},
      create: { ...po, created_by: pm1.id, company_id: company.id } as any,
    });
  }
  console.log('🛒 Purchase Orders seeded');

  // ── Invoices ──────────────────────────────────────────────
  const invoicesData = [
    { id: 'inv_001', number: 'INV-2026-001', vendor_id: 'vend_cement_co', amount: 1800000, total: 2016000, tax_amount: 216000, due_date: daysAgo(10), status: 'PAID' },
    { id: 'inv_002', number: 'INV-2026-002', vendor_id: 'vend_steel_co', amount: 3500000, total: 3920000, tax_amount: 420000, due_date: daysAgo(5), status: 'SENT' },
    { id: 'inv_003', number: 'INV-2026-003', vendor_id: 'vend_brick_co', amount: 950000, total: 1064000, tax_amount: 114000, due_date: monthsFromNow(1), status: 'DRAFT' },
    { id: 'inv_004', number: 'INV-2026-004', vendor_id: 'vend_aggregate', amount: 750000, total: 840000, tax_amount: 90000, due_date: daysAgo(20), status: 'PAID' },
    { id: 'inv_005', number: 'INV-2026-005', vendor_id: 'vend_crane_co', amount: 2200000, total: 2464000, tax_amount: 264000, due_date: monthsFromNow(2), status: 'DRAFT' },
    { id: 'inv_006', number: 'INV-2026-006', vendor_id: 'vend_cement_co', amount: 1350000, total: 1512000, tax_amount: 162000, due_date: daysAgo(15), status: 'PAID' },
  ];

  for (const inv of invoicesData) {
    await prisma.invoice.upsert({
      where: { id: inv.id },
      update: {},
      create: { ...inv, company_id: company.id } as any,
    });
  }
  console.log('🧾 Invoices seeded');

  // ── Tasks ─────────────────────────────────────────────────
  const tasksData = [
    { id: 'task_001', title: 'Pour 6th floor slab concrete', project_id: 'proj_downtown_plaza', site_id: 'site_dp_tower', assigned_to: sup1.id, status: 'IN_PROGRESS', priority: 'HIGH', due_date: daysAgo(-5) },
    { id: 'task_002', title: 'Fix structural steel rebars — Tower B', project_id: 'proj_gulshan_residency', site_id: 'site_gr_tower2', assigned_to: sup3.id, status: 'IN_PROGRESS', priority: 'HIGH', due_date: daysAgo(-3) },
    { id: 'task_003', title: 'Complete bathroom tiling — Block A', project_id: 'proj_dha_villas', site_id: 'site_dha_block_a', assigned_to: sup2.id, status: 'IN_PROGRESS', priority: 'MEDIUM', due_date: daysAgo(-2) },
    { id: 'task_004', title: 'Piling inspection sign-off', project_id: 'proj_clifton_heights', site_id: 'site_clifton_core', assigned_to: pm2.id, status: 'TODO', priority: 'HIGH', due_date: daysAgo(-7) },
    { id: 'task_005', title: 'Install electrical conduits GF', project_id: 'proj_bahria_commercial', site_id: 'site_bahria_main', assigned_to: sup2.id, status: 'DONE', priority: 'MEDIUM', due_date: daysAgo(3) },
    { id: 'task_006', title: 'Survey basement waterproofing', project_id: 'proj_downtown_plaza', site_id: 'site_dp_basement', assigned_to: sup1.id, status: 'DONE', priority: 'HIGH', due_date: daysAgo(5) },
    { id: 'task_007', title: 'Submit DPR for Tower A', project_id: 'proj_gulshan_residency', site_id: 'site_gr_tower1', assigned_to: sup1.id, status: 'TODO', priority: 'LOW', due_date: daysAgo(-1) },
    { id: 'task_008', title: 'Order cement for next pour', project_id: 'proj_downtown_plaza', site_id: 'site_dp_tower', assigned_to: pm1.id, status: 'TODO', priority: 'MEDIUM', due_date: daysAgo(-4) },
    { id: 'task_009', title: 'External wall plaster — Block B', project_id: 'proj_dha_villas', site_id: 'site_dha_block_b', assigned_to: sup3.id, status: 'IN_PROGRESS', priority: 'MEDIUM', due_date: daysAgo(-6) },
    { id: 'task_010', title: 'MEP coordination meeting', project_id: 'proj_clifton_heights', site_id: 'site_clifton_core', assigned_to: pm2.id, status: 'TODO', priority: 'HIGH', due_date: daysAgo(-10) },
    { id: 'task_011', title: 'Quality inspection 2nd floor', project_id: 'proj_bahria_commercial', site_id: 'site_bahria_main', assigned_to: pm1.id, status: 'IN_PROGRESS', priority: 'HIGH', due_date: daysAgo(-3) },
    { id: 'task_012', title: 'Procure shuttering plates', project_id: 'proj_gulshan_residency', site_id: 'site_gr_tower1', assigned_to: sup1.id, status: 'DONE', priority: 'LOW', due_date: daysAgo(10) },
  ];

  for (const t of tasksData) {
    await prisma.task.upsert({
      where: { id: t.id },
      update: { status: t.status as any },
      create: {
        id: t.id,
        title: t.title,
        project_id: t.project_id,
        site_id: t.site_id,
        assignee_id: t.assigned_to,
        status: t.status as any,
        priority: t.priority as any,
        due_date: t.due_date,
        created_by: builder.id,
        company_id: company.id,
      } as any,
    });
  }
  console.log('✅ Tasks seeded');

  // ── Daily Progress Reports ────────────────────────────────
  console.log('📊 Seeding DPRs (30 days)...');
  const weatherOptions = ['Clear', 'Partly Cloudy', 'Overcast', 'Light Rain'];
  const activitiesOptions = [
    'Slab shuttering completed on east wing',
    'Rebar placement for columns done',
    'Concrete pouring on 4th floor',
    'Brickwork completed up to window sill level',
    'Internal plastering of units 301-306',
    'Electrical conduit laying on 2nd floor',
  ];

  for (let day = 29; day >= 0; day--) {
    const date = daysAgo(day);
    if (date.getDay() === 0) continue;
    for (const site of sites.slice(0, 4)) {
      const dprId = `dpr_${site.id}_${day}`;
      const existingDpr = await prisma.dailyReport.findFirst({ where: { id: dprId } });
      if (existingDpr) continue;

      await prisma.dailyReport.create({
        data: {
          id: dprId,
          site_id: site.id,
          submitted_by: [sup1.id, sup2.id, sup3.id][day % 3],
          report_date: date,
          weather: weatherOptions[day % weatherOptions.length],
          workers_count: 15 + Math.floor(Math.random() * 25),
          summary: activitiesOptions[day % activitiesOptions.length],
          work_completed: activitiesOptions[(day + 2) % activitiesOptions.length],
          tomorrow_plan: activitiesOptions[(day + 3) % activitiesOptions.length],
          company_id: company.id,
        } as any
      });
    }
  }
  console.log('✅ DPRs seeded');

  // ── Notifications ─────────────────────────────────────────
  const notifData = [
    { title: 'Low Stock Alert', message: 'Steel Rebar stock is critically low at DHA Block A site. Current: 80 kg, minimum required: 500 kg.', type: 'ALERT', priority: 'HIGH' },
    { title: 'Milestone Achieved', message: 'Foundation complete milestone achieved for Downtown Commercial Plaza.', type: 'INFO', priority: 'NORMAL' },
    { title: 'Expense Pending Approval', message: '3 expense vouchers are pending your approval totaling ₹8.6L.', type: 'ACTION', priority: 'HIGH' },
    { title: 'DPR Submitted', message: 'Bilal Hassan submitted DPR for Downtown Plaza Tower Block.', type: 'INFO', priority: 'NORMAL' },
    { title: 'New Purchase Order', message: 'PO-2026-008 raised for aggregates by Farhan Sheikh. Requires approval.', type: 'ACTION', priority: 'HIGH' },
    { title: 'Worker Absent', message: '4 workers absent at Gulshan Residency Tower A today without notice.', type: 'ALERT', priority: 'NORMAL' },
    { title: 'Invoice Overdue', message: 'Invoice INV-2026-002 from Ittefaq Steel Mills is 5 days overdue.', type: 'ALERT', priority: 'HIGH' },
    { title: 'Material Delivered', message: 'Cement delivery of 500 bags received at Downtown Plaza site.', type: 'INFO', priority: 'NORMAL' },
  ];

  for (let i = 0; i < notifData.length; i++) {
    const nId = `notif_seed_${i}`;
    const existing = await prisma.notification.findFirst({ where: { id: nId } });
    if (!existing) {
      await prisma.notification.create({
        data: {
          id: nId,
          user_id: builder.id,
          ...notifData[i],
          is_read: i > 3,
          company_id: company.id,
          created_at: daysAgo(i),
        } as any
      });
    }
  }
  console.log('🔔 Notifications seeded');

  // ── Attachments (Phase 5.5 Universal Media Engine) ─────────
  console.log('📎 Seeding Attachments...');
  const attachmentData = [
    { id: 'att_001', entity_type: 'PROJECT', entity_id: 'proj_downtown_plaza', category: 'Blueprint', file_name: 'structural_plan.pdf', mime_type: 'application/pdf', file_size: 4500000, secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/sample.jpg' },
    { id: 'att_002', entity_type: 'DPR', entity_id: 'dpr_site_dp_tower_1', category: 'Progress Photo', file_name: 'site_progress_1.jpg', mime_type: 'image/jpeg', file_size: 1200000, secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/sample.jpg' },
    { id: 'att_003', entity_type: 'EXPENSE', entity_id: 'exp_proj_downtown_plaza_5', category: 'Receipt', file_name: 'cement_receipt.jpg', mime_type: 'image/jpeg', file_size: 850000, secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/sample.jpg' },
    { id: 'att_004', entity_type: 'WORKER', entity_id: 'worker_001', category: 'Profile Photo', file_name: 'worker_001_id.jpg', mime_type: 'image/jpeg', file_size: 300000, secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/sample.jpg' },
    { id: 'att_005', entity_type: 'INVENTORY_TXN', entity_id: 'inv_txn_001', category: 'Delivery Photo', file_name: 'delivery_truck.jpg', mime_type: 'image/jpeg', file_size: 2100000, secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/sample.jpg' }
  ];

    for (const att of attachmentData) {
    await prisma.attachment.upsert({
      where: { id: att.id },
      update: {},
      create: {
        ...att,
        uploaded_by: builder.id,
        company_id: company.id,
      } as any,
    });
  }
  console.log('📎 Attachments seeded');

  // ── Starter & Growth Projects ─────────────────────────────
  console.log('🏗️ Seeding Starter & Growth Projects...');
  // Starter: Exactly 1 Active Project
  await prisma.project.upsert({
    where: { id: 'proj_starter_horizon' },
    update: { company_id: starterCompany.id, builder_id: starterBuilder.id, status: 'ACTIVE' },
    create: {
      id: 'proj_starter_horizon',
      name: 'Starter Horizon Heights',
      description: 'Single active luxury boutique project (₹30K Starter Plan demo)',
      builder_id: starterBuilder.id,
      status: 'ACTIVE',
      start_date: monthsAgo(2),
      end_date: monthsFromNow(10),
      budget: 15000000,
      address: 'Sector 12, Expressway',
      city: 'Gurugram',
      progress_percentage: 25,
      company_id: starterCompany.id,
    } as any,
  });

  // Growth: Exactly 3 Active Projects
  const growthProjectsData = [
    { id: 'proj_growth_residency_1', name: 'Growth Residency Tower A', description: 'G+14 residential apartments (₹50K Plan Demo #1)', builder_id: growthBuilder.id, status: 'ACTIVE', start_date: monthsAgo(3), end_date: monthsFromNow(9), budget: 35000000, address: 'Plot 10, Ring Road', city: 'Noida', progress_percentage: 40 },
    { id: 'proj_growth_residency_2', name: 'Growth Residency Tower B', description: 'G+14 residential apartments (₹50K Plan Demo #2)', builder_id: growthBuilder.id, status: 'ACTIVE', start_date: monthsAgo(2), end_date: monthsFromNow(12), budget: 38000000, address: 'Plot 11, Ring Road', city: 'Noida', progress_percentage: 20 },
    { id: 'proj_growth_plaza', name: 'Growth Apex Plaza', description: 'Commercial business center (₹50K Plan Demo #3)', builder_id: growthBuilder.id, status: 'ACTIVE', start_date: monthsAgo(4), end_date: monthsFromNow(6), budget: 50000000, address: 'Sector 62', city: 'Noida', progress_percentage: 65 },
  ];
  for (const gp of growthProjectsData) {
    await prisma.project.upsert({
      where: { id: gp.id },
      update: { company_id: growthCompany.id, builder_id: growthBuilder.id, status: gp.status as any },
      create: { ...gp, company_id: growthCompany.id } as any,
    });
  }
  console.log('✅ Starter & Growth projects seeded');

  // ── CRM Dataset (Premium Company Exclusive) ───────────────
  console.log('💼 Seeding CRM Leads & Sales Pipeline...');
  const crmLeadsData = [
    { id: 'lead_crm_1', name: 'Vikram Malhotra', phone: '+91-9811223344', email: 'vikram.m@gmail.com', type: 'BUYER', status: 'QUALIFIED', priority: 'HIGH', budget: '₹1.5 Cr - ₹2 Cr', city: 'Mumbai', source: 'Direct', initials: 'VM', avatar_color: '#2648E7', notes: 'Interested in 3BHK penthouse at Downtown Commercial Plaza' },
    { id: 'lead_crm_2', name: 'Ananya Sharma', phone: '+91-9822334455', email: 'ananya.s@outlook.com', type: 'INVESTOR', status: 'SITE_VISIT', priority: 'HIGH', budget: '₹3 Cr+', city: 'Bengaluru', source: 'Referral', initials: 'AS', avatar_color: '#10B981', notes: 'Looking for 2 commercial units at Downtown Plaza' },
    { id: 'lead_crm_3', name: 'Rajesh Khanna', phone: '+91-9833445566', email: 'r.khanna@yahoo.com', type: 'BUYER', status: 'NEGOTIATION', priority: 'MEDIUM', budget: '₹85 Lakhs', city: 'Delhi NCR', source: 'Website', initials: 'RK', avatar_color: '#3B82F6', notes: 'Discussing payment schedules for commercial floor' },
    { id: 'lead_crm_4', name: 'Meera Patel', phone: '+91-9844556677', email: 'meera.p@gmail.com', type: 'BUYER', status: 'BOOKED', priority: 'HIGH', budget: '₹1.2 Cr', city: 'Mumbai', source: 'Walk-in', initials: 'MP', avatar_color: '#EC4899', notes: 'Booked Retail Unit 102 at Downtown Plaza' },
    { id: 'lead_crm_5', name: 'Sunil Verma', phone: '+91-9855667788', email: 'sunil.verma@techcorp.in', type: 'INVESTOR', status: 'NEW', priority: 'LOW', budget: '₹50 Lakhs', city: 'Pune', source: 'Social Media', initials: 'SV', avatar_color: '#F59E0B', notes: 'Initial enquiry via Digital Ad' },
  ];

  for (const ld of crmLeadsData) {
    await prisma.crmLead.upsert({
      where: { id: ld.id },
      update: { ...ld, company_id: company.id, project_id: 'proj_downtown_plaza' } as any,
      create: {
        ...ld,
        company_id: company.id,
        project_id: 'proj_downtown_plaza',
        created_by: builder.id,
        assigned_to: builder.id,
      } as any,
    });
  }

  // CRM Follow-ups
  await prisma.crmFollowup.upsert({
    where: { id: 'flw_crm_1' },
    update: { company_id: company.id },
    create: {
      id: 'flw_crm_1',
      company_id: company.id,
      lead_id: 'lead_crm_1',
      created_by: builder.id,
      note: 'Call to confirm site visit time for Saturday 11 AM',
      status: 'PENDING',
      due_at: new Date(Date.now() + 86400000),
    },
  });

  await prisma.crmFollowup.upsert({
    where: { id: 'flw_crm_2' },
    update: { company_id: company.id },
    create: {
      id: 'flw_crm_2',
      company_id: company.id,
      lead_id: 'lead_crm_3',
      created_by: builder.id,
      note: 'Send revised payment breakdown and discount terms',
      status: 'PENDING',
      due_at: new Date(Date.now() + 86400000 * 2),
    },
  });

  // CRM Deals
  await prisma.crmDeal.upsert({
    where: { id: 'deal_crm_1' },
    update: {
      company_id: company.id,
      project_id: 'proj_downtown_plaza',
      customer_name: 'Meera Patel',
      property_name: 'Downtown Plaza - Retail Unit 102',
    },
    create: {
      id: 'deal_crm_1',
      company_id: company.id,
      lead_id: 'lead_crm_4',
      project_id: 'proj_downtown_plaza',
      created_by: builder.id,
      customer_name: 'Meera Patel',
      property_name: 'Downtown Plaza - Retail Unit 102',
      deal_value: 12000000,
      commission: 240000,
      amount_received: 2500000,
      payment_mode: 'Bank Transfer',
      transaction_id: 'TXN-2026-98124',
      deal_date: daysAgo(5),
      notes: 'Initial booking token received and agreement drafted',
    },
  });

  // CRM Properties Catalog
  const crmPropertiesData = [
    { id: 'prop_crm_1', name: 'Downtown Plaza 3BHK Luxury Office Suite', address: 'BKC, G Block, Bandra East, Mumbai', price: '₹1.85 Cr', type: 'Sale', beds: 3, baths: 3, sqft: '2,400 sq.ft', status: 'Available', featured: true, project_id: 'proj_downtown_plaza' },
    { id: 'prop_crm_2', name: 'Downtown Executive IT Floor', address: 'BKC, G Block, Bandra East, Mumbai', price: '₹95 Lakhs', type: 'Sale', beds: 2, baths: 2, sqft: '1,350 sq.ft', status: 'Available', featured: false, project_id: 'proj_downtown_plaza' },
    { id: 'prop_crm_3', name: 'Downtown Ground Floor Premium Retail', address: 'BKC, G Block, Bandra East, Mumbai', price: '₹3.2 Cr', type: 'Sale', beds: 4, baths: 5, sqft: '4,500 sq.ft', status: 'Available', featured: true, project_id: 'proj_downtown_plaza' },
  ];

  for (const pr of crmPropertiesData) {
    await prisma.crmProperty.upsert({
      where: { id: pr.id },
      update: { ...pr, company_id: company.id, project_id: 'proj_downtown_plaza' },
      create: {
        ...pr,
        company_id: company.id,
      },
    });
  }
  console.log('✅ CRM dataset seeded successfully');

  console.log('');
  console.log('===========================================================');
  console.log(' Apni Estate Subscriptions & Demo Accounts Ready');
  console.log('===========================================================');
  console.log('1. DEMO 1 — PREMIUM (₹1,00,000 Plan):');
  console.log('   Email:       admin@gmail.com');
  console.log('   Password:    admin123');
  console.log('   Plan:        ₹1,00,000 / month (12m Active Demo)');
  console.log('   CRM:         ENABLED (Leads, Deals, Followups)');
  console.log('   Projects:    UNLIMITED (5 seeded active projects)');
  console.log('');
  console.log('2. DEMO 2 — STARTER (₹30,000 Plan):');
  console.log('   Email:       starter@apniestate.com');
  console.log('   Password:    starter123');
  console.log('   Plan:        ₹30,000 / month (12m Active Demo)');
  console.log('   CRM:         DISABLED');
  console.log('   Projects:    1 Active Project (1/1 limit reached)');
  console.log('');
  console.log('3. DEMO 3 — GROWTH (₹50,000 Plan):');
  console.log('   Email:       growth@apniestate.com');
  console.log('   Password:    growth123');
  console.log('   Plan:        ₹50,000 / month (12m Active Demo)');
  console.log('   CRM:         DISABLED');
  console.log('   Projects:    3 Active Projects (3/3 limit reached)');
  console.log('===========================================================');
}

main()
  .catch(e => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
