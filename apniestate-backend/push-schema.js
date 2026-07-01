const fs = require('fs');
const { Client } = require('pg');

async function pushSchema() {
  const sql = fs.readFileSync('schema.sql', 'utf-8');
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgres://961863b4a209628ca5f4cc52cd53ecd4867b8efd702f3faac442bddc8a968993:sk_HCPevs-xLS1qfZHlsrR79@db.prisma.io:5432/postgres?sslmode=require',
  });

  try {
    await client.connect();
    console.log('Connected. Pushing schema...');
    await client.query(sql);
    console.log('Schema pushed successfully!');
  } catch (e) {
    console.error('Error pushing schema:', e);
  } finally {
    await client.end();
  }
}

pushSchema();
