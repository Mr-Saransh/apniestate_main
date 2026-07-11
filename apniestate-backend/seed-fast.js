const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function run() {
  const connectionString = process.env.DATABASE_URL;
  console.log(`Connecting to ${connectionString.split('@')[1]}...`);

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Supabase via pg!');

    // Passwords
    const pass = await bcrypt.hash('admin123', 10);

    // 1. Company
    await client.query(`
      INSERT INTO "public"."companies" (id, name, created_at, updated_at) 
      VALUES ('cl_demo_company_1', 'Apni Estate Demo', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;
    `);

    // 2. Users
    const users = [
      { id: 'usr_1', name: 'Asim Raza', email: 'admin@gmail.com', role: 'BUILDER' },
      { id: 'usr_2', name: 'System Admin', email: 'admin@apniestate.com', role: 'ADMIN' },
      { id: 'usr_3', name: 'Sara Ahmed', email: 'pm2@apniestate.com', role: 'PROJECT_MANAGER' },
      { id: 'usr_4', name: 'Bilal Hassan', email: 'sup1@apniestate.com', role: 'SITE_SUPERVISOR' },
      { id: 'usr_5', name: 'Nadia Malik', email: 'accounts@apniestate.com', role: 'ACCOUNTANT' }
    ];

    for (const u of users) {
      await client.query(`
        INSERT INTO "public"."users" (id, name, email, password_hash, role, company_id, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, 'cl_demo_company_1', true, NOW(), NOW())
        ON CONFLICT (email) DO NOTHING;
      `, [u.id, u.name, u.email, pass, u.role]);

      await client.query(`
        INSERT INTO "public"."company_memberships" (id, user_id, company_id, roles, status, created_at, updated_at)
        VALUES (gen_random_uuid(), (SELECT id FROM "public"."users" WHERE email = $1), 'cl_demo_company_1', ARRAY[$2]::"public"."Role"[], 'ACTIVE', NOW(), NOW())
        ON CONFLICT DO NOTHING;
      `, [u.email, u.role]);
    }

    // 3. Project & Site
    await client.query(`
      INSERT INTO "public"."projects" (id, name, company_id, builder_id, manager_id, status, budget, start_date, end_date, created_at, updated_at)
      VALUES ('proj_1', 'Gulberg Greens Plaza', 'cl_demo_company_1', (SELECT id FROM users WHERE email='admin@gmail.com'), (SELECT id FROM users WHERE email='pm2@apniestate.com'), 'ACTIVE', 50000000, NOW(), NOW() + interval '1 year', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;
    `);

    await client.query(`
      INSERT INTO "public"."sites" (id, name, project_id, company_id, supervisor_id, location, status, created_at, updated_at)
      VALUES ('site_1', 'Main Structure', 'proj_1', 'cl_demo_company_1', (SELECT id FROM users WHERE email='sup1@apniestate.com'), 'Islamabad', 'IN_PROGRESS', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;
    `);

    console.log('✅ Fast seed completed!');

  } catch (err) {
    console.error('Error seeding:', err);
  } finally {
    await client.end();
  }
}

run();
