const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connected to PostgreSQL!');

  const workerNames = [
    'Ramesh Kumar', 'Suresh Sharma', 'Mahesh Verma', 'Dinesh Gupta', 'Mukesh Yadav', 'Rajesh Patel', 'Ganesh Joshi', 'Rakesh Singh', 'Naresh Pandey', 'Pankaj Mishra',
    'Santosh Chauhan', 'Manoj Tiwari', 'Sunil Saini', 'Anil Rawat', 'Deepak Maurya', 'Vinod Prajapati', 'Ajay Thakur', 'Vijay Rathore', 'Ashok Bind', 'Kishore Sonkar',
    'Brijesh Paswan', 'Dharmendra Gautam', 'Ram Sevak', 'Shiv Kumar', 'Gopal Das', 'Harish Chandra', 'Kishan Lal', 'Mohan Lal', 'Bhola Nath', 'Shyam Sundar',
    'Jagdish Prasad', 'Om Prakash', 'Radhey Shyam', 'Chandra Prakash', 'Suraj Pal', 'Hemant Kumar', 'Kundan Singh', 'Lalit Mohan', 'Devendra Kumar', 'Pravin Shinde',
    'Sanjay Kamble', 'Nitin Gaikwad', 'Sachin More', 'Rahul Jadhav', 'Vikas Sawant', 'Pradeep Pawar', 'Sandip Kadam', 'Kiran Shirodkar', 'Amol Deshpande', 'Girish Kulkarni',
    'Tushar Joshi', 'Vishal Mane'
  ];

  const res = await client.query(`SELECT id FROM "workers" ORDER BY created_at ASC`);
  console.log(`Updating ${res.rows.length} workers...`);

  for (let i = 0; i < res.rows.length; i++) {
    const wId = res.rows[i].id;
    const name = workerNames[i % workerNames.length];
    const phone = `+91-98${String(10000000 + i * 179).slice(-8)}`;
    await client.query(`UPDATE "workers" SET name = $1, phone = $2 WHERE id = $3`, [name, phone, wId]);
  }

  console.log('✅ Updated all workers to Indian names and +91 phone numbers!');
  await client.end();
}

main().catch(console.error);
