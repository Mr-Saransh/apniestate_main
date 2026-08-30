const http = require('http');

function post(path, data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3001,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => resolve(JSON.parse(body)));
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function get(path, token) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3001,
        path,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => resolve(JSON.parse(body)));
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  const login = await post('/api/auth/login', { identifier: 'admin@gmail.com', password: 'admin123' });
  const token = login.data?.accessToken;
  const projectsRes = await get('/api/projects', token);

  console.log('Active projects for Admin demo:');
  projectsRes.data?.forEach((p) => {
    console.log(` - ${p.name} (${p.city || 'No city'}) [${p.status}]`);
  });
}

run().catch(console.error);
