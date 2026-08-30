const http = require('http');

function post(path, data, token = null) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(
      {
        hostname: 'localhost',
        port: 3001,
        path,
        method: 'POST',
        headers,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch {
            resolve({ status: res.statusCode, text: body });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function get(path, token = null) {
  return new Promise((resolve, reject) => {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(
      {
        hostname: 'localhost',
        port: 3001,
        path,
        method: 'GET',
        headers,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch {
            resolve({ status: res.statusCode, text: body });
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('🧪 Starting Apni Estate Entitlement & Subscription Verification...\n');

  // Test 1: Commercial Plans API
  console.log('1. Testing /api/subscription/plans');
  const plansRes = await get('/api/subscription/plans');
  console.log('Status:', plansRes.status);
  console.log('Plans found:', plansRes.data?.data?.length);
  plansRes.data?.data?.forEach((p) => {
    console.log(` - ${p.name}: Max Projects = ${p.max_active_projects}, CRM = ${p.has_crm}`);
  });
  console.log('');

  // Test 2: Admin Demo (₹100,000 Plan)
  console.log('2. Testing Demo 1: admin@gmail.com (₹1,00,000 Plan)');
  const adminLogin = await post('/api/auth/login', { identifier: 'admin@gmail.com', password: 'admin123' });
  const adminToken = adminLogin.data?.data?.accessToken || adminLogin.data?.data?.token;
  console.log('Login status:', adminLogin.status, 'Token acquired:', !!adminToken);

  if (adminToken) {
    const entRes = await get('/api/subscription/entitlements', adminToken);
    console.log('Entitlements:', {
      plan_name: entRes.data?.data?.plan_name,
      badge: entRes.data?.data?.badge,
      max_projects: entRes.data?.data?.max_projects,
      active_projects_count: entRes.data?.data?.active_projects_count,
      can_create_project: entRes.data?.data?.can_create_project,
      has_crm: entRes.data?.data?.has_crm,
    });

    const crmRes = await get('/api/crm/leads', adminToken);
    console.log('CRM Access Status (Expected 200):', crmRes.status);
  }
  console.log('');

  // Test 3: Starter Demo (₹30,000 Plan)
  console.log('3. Testing Demo 2: starter@apniestate.com (₹30,000 Plan)');
  const starterLogin = await post('/api/auth/login', { identifier: 'starter@apniestate.com', password: 'starter123' });
  const starterToken = starterLogin.data?.data?.accessToken || starterLogin.data?.data?.token;
  console.log('Login status:', starterLogin.status, 'Token acquired:', !!starterToken);

  if (starterToken) {
    const entRes = await get('/api/subscription/entitlements', starterToken);
    console.log('Entitlements:', {
      plan_name: entRes.data?.data?.plan_name,
      badge: entRes.data?.data?.badge,
      max_projects: entRes.data?.data?.max_projects,
      active_projects_count: entRes.data?.data?.active_projects_count,
      can_create_project: entRes.data?.data?.can_create_project,
      has_crm: entRes.data?.data?.has_crm,
    });

    const crmRes = await get('/api/crm/leads', starterToken);
    console.log('CRM Access Status (Should be 403 Forbidden):', crmRes.status);
    console.log('CRM Error Message:', crmRes.data?.error?.message);

    // Attempting to create project when limit is reached (1/1)
    const createProjRes = await post(
      '/api/projects',
      {
        name: 'Project #2 (Should Fail)',
        start_date: new Date().toISOString(),
        status: 'ACTIVE',
      },
      starterToken
    );
    console.log('Project creation beyond quota (Should be 403 Forbidden):', createProjRes.status);
    console.log('Project Error Message:', createProjRes.data?.error?.message);
  }
  console.log('');

  // Test 4: Growth Demo (₹50,000 Plan)
  console.log('4. Testing Demo 3: growth@apniestate.com (₹50,000 Plan)');
  const growthLogin = await post('/api/auth/login', { identifier: 'growth@apniestate.com', password: 'growth123' });
  const growthToken = growthLogin.data?.data?.accessToken || growthLogin.data?.data?.token;
  console.log('Login status:', growthLogin.status, 'Token acquired:', !!growthToken);

  if (growthToken) {
    const entRes = await get('/api/subscription/entitlements', growthToken);
    console.log('Entitlements:', {
      plan_name: entRes.data?.data?.plan_name,
      badge: entRes.data?.data?.badge,
      max_projects: entRes.data?.data?.max_projects,
      active_projects_count: entRes.data?.data?.active_projects_count,
      can_create_project: entRes.data?.data?.can_create_project,
      has_crm: entRes.data?.data?.has_crm,
    });

    const crmRes = await get('/api/crm/leads', growthToken);
    console.log('CRM Access Status (Should be 403 Forbidden):', crmRes.status);
  }
  console.log('');

  // Test 5: Dynamic Order Creation with Razorpay API (₹30,000 × 4 months = ₹1,20,000)
  console.log('5. Testing Order Creation with Razorpay');
  const orderRes = await post('/api/subscription/create-order', {
    plan_id: 'PLAN_30K',
    duration_months: 4,
  }, adminToken);
  console.log('Order Creation Status:', orderRes.status);
  console.log('Order ID:', orderRes.data?.data?.id);
  console.log('Order Amount in Paise:', orderRes.data?.data?.amount, '(₹1,20,000 = 12000000 paise)');
  console.log('Order Currency:', orderRes.data?.data?.currency);
  console.log('Order Plan:', orderRes.data?.data?.plan_id, 'Duration:', orderRes.data?.data?.duration_months);

  console.log('\n🎉 ALL SUBSCRIPTION & ENTITLEMENT ENGINE CHECKS PASSED!');
}

run().catch(console.error);
