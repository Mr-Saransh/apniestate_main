const fs = require('fs');

const envPath = '.env';
let content = fs.readFileSync(envPath, 'utf8');

// Restore pooler URLs
content = content.replace(/db\.eerlsaaeldozxszefcwa\.supabase\.co:5432/g, 'aws-0-us-east-1.pooler.supabase.com:6543');

// Re-add pgbouncer manually for DATABASE_URL and POSTGRES_PRISMA_URL
content = content.replace('DATABASE_URL="postgres://postgres.eerlsaaeldozxszefcwa:WQ1BzIBhOobqAQEd@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require"', 'DATABASE_URL="postgres://postgres.eerlsaaeldozxszefcwa:WQ1BzIBhOobqAQEd@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true&connection_limit=5"');
content = content.replace('POSTGRES_PRISMA_URL="postgres://postgres.eerlsaaeldozxszefcwa:WQ1BzIBhOobqAQEd@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require"', 'POSTGRES_PRISMA_URL="postgres://postgres.eerlsaaeldozxszefcwa:WQ1BzIBhOobqAQEd@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"');

// Re-add supa=base-pooler for DIRECT_URL and POSTGRES_URL
content = content.replace('DIRECT_URL="postgres://postgres.eerlsaaeldozxszefcwa:WQ1BzIBhOobqAQEd@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require"', 'DIRECT_URL="postgres://postgres.eerlsaaeldozxszefcwa:WQ1BzIBhOobqAQEd@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x"');
content = content.replace('POSTGRES_URL="postgres://postgres.eerlsaaeldozxszefcwa:WQ1BzIBhOobqAQEd@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require"', 'POSTGRES_URL="postgres://postgres.eerlsaaeldozxszefcwa:WQ1BzIBhOobqAQEd@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x"');


fs.writeFileSync(envPath, content);
console.log('Restored pooler URLs');
