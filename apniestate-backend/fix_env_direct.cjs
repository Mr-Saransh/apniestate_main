const fs = require('fs');
const envPath = '.env';
let content = fs.readFileSync(envPath, 'utf8');

content = content.replace(
    'DIRECT_URL="postgres://postgres.eerlsaaeldozxszefcwa:WQ1BzIBhOobqAQEd@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x"',
    'DIRECT_URL="postgres://postgres:WQ1BzIBhOobqAQEd@db.eerlsaaeldozxszefcwa.supabase.co:5432/postgres"'
);

fs.writeFileSync(envPath, content);
console.log('Fixed DIRECT_URL permanently');
