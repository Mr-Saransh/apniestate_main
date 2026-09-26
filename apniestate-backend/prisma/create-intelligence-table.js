process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

// Load .env
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.substring(0, idx).trim();
      let val = trimmed.substring(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
console.log('Connecting to database...');

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  const client = await pool.connect();
  try {
    console.log('Connected! Creating enum and table if not exists...');

    // 1. Create Enum
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "SuggestionStatus" AS ENUM ('SUGGESTED', 'APPROVED', 'REMOVED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✓ Enum SuggestionStatus verified/created');

    // 2. Create Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "intelligence_suggestions" (
        "id" TEXT NOT NULL,
        "project_id" TEXT NOT NULL,
        "company_id" TEXT,
        "type" TEXT NOT NULL DEFAULT 'MILESTONE',
        "name" TEXT NOT NULL,
        "description" TEXT,
        "suggested_start" TIMESTAMP(3),
        "suggested_end" TIMESTAMP(3),
        "duration_days" INTEGER,
        "reason" TEXT,
        "source" TEXT,
        "status" "SuggestionStatus" NOT NULL DEFAULT 'SUGGESTED',
        "approved_at" TIMESTAMP(3),
        "approved_by" TEXT,
        "milestone_id" TEXT,
        "sort_order" INTEGER NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "intelligence_suggestions_pkey" PRIMARY KEY ("id")
      );
    `);
    console.log('✓ Table intelligence_suggestions verified/created');

    // 3. Create Indexes
    await client.query(`CREATE INDEX IF NOT EXISTS "idx_suggestion_project" ON "intelligence_suggestions"("project_id");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "idx_suggestion_company" ON "intelligence_suggestions"("company_id");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "idx_suggestion_status" ON "intelligence_suggestions"("status");`);
    console.log('✓ Indexes verified/created');

    console.log('ALL DONE! Migration successful.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
