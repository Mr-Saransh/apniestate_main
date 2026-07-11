const { Client } = require('pg');
const fs = require('fs');

async function run() {
  const connectionString = 'postgres://postgres.eerlsaaeldozxszefcwa:WQ1BzIBhOobqAQEd@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x';
  const client = new Client({ 
    connectionString,
    ssl: { rejectUnauthorized: false } 
  });
  try {
    await client.connect();
    console.log('Connected to Supabase via IPv4 Pooler');
    
    // First, let's drop schema public and recreate it to simulate a reset
    await client.query('DROP SCHEMA public CASCADE;');
    await client.query('CREATE SCHEMA public;');
    await client.query('GRANT ALL ON SCHEMA public TO postgres;');
    await client.query('GRANT ALL ON SCHEMA public TO public;');
    console.log('Schema public reset.');

    // PowerShell > output is UTF-16LE on Windows
    const sql = fs.readFileSync('schema.sql', 'utf16le');
    
    // Split by semicolons at the end of lines
    const statements = sql
      .split(/;\s*\n/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
      
    console.log(`Running ${statements.length} statements...`);
    let count = 1;
    for (const stmt of statements) {
      console.log(`Executing ${count}/${statements.length}: ${stmt.substring(0, 50)}...`);
      await client.query(stmt + ';');
      count++;
    }
    console.log('Schema applied successfully!');
  } catch (err) {
    console.error('Error applying schema:', err);
  } finally {
    await client.end();
  }
}
run();
