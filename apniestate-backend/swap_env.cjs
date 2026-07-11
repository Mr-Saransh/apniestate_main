const fs = require('fs');

const envPath = '.env';
let content = fs.readFileSync(envPath, 'utf8');

content = content.replace(/aws-0-us-east-1\.pooler\.supabase\.com:6543/g, 'db.eerlsaaeldozxszefcwa.supabase.co:5432');
content = content.replace(/&pgbouncer=true/g, '');
content = content.replace(/&supa=base-pooler\.x/g, '');

fs.writeFileSync(envPath, content);
console.log('Swapped to direct URL');
