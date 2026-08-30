const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connected to PostgreSQL!');

  await client.query(`
    UPDATE "users" SET name = 'Aditya Sharma', phone = '+91-9820112233', city = 'Mumbai', state = 'Maharashtra' WHERE email = 'admin@gmail.com';
    UPDATE "users" SET name = 'Aditya Sharma (Alt)', phone = '+91-9820112234', city = 'Mumbai', state = 'Maharashtra' WHERE email = 'builder@apniestate.com';
    UPDATE "users" SET name = 'Suresh Patel', phone = '+91-9876543210', city = 'Gurugram', state = 'Haryana' WHERE email = 'starter@apniestate.com';
    UPDATE "users" SET name = 'Gaurav Singhal', phone = '+91-9876543220', city = 'Noida', state = 'Uttar Pradesh' WHERE email = 'growth@apniestate.com';
    UPDATE "users" SET name = 'Rohan Mehra', phone = '+91-9820223344' WHERE email = 'pm1@apniestate.com';
    UPDATE "users" SET name = 'Pooja Iyer', phone = '+91-9820334455' WHERE email = 'pm2@apniestate.com';
    UPDATE "users" SET name = 'Vikram Joshi', phone = '+91-9820445566' WHERE email = 'sup1@apniestate.com';
    UPDATE "users" SET name = 'Amitabh Gupta', phone = '+91-9820556677' WHERE email = 'sup2@apniestate.com';
    UPDATE "users" SET name = 'Suresh Rao', phone = '+91-9820667788' WHERE email = 'sup3@apniestate.com';
    UPDATE "users" SET name = 'Neha Kulkarni', phone = '+91-9820778899' WHERE email = 'accounts@apniestate.com';

    UPDATE "projects" SET name = 'Downtown Commercial Plaza', description = 'A 12-story G+11 premium commercial IT & business park', address = 'Bandra Kurla Complex (BKC), G Block', city = 'Mumbai' WHERE id = 'proj_downtown_plaza';
    UPDATE "sites" SET name = 'Downtown Plaza — Tower Block', location = 'BKC, Bandra East, Mumbai' WHERE id = 'site_dp_tower';
    UPDATE "sites" SET name = 'Downtown Plaza — Basement & Parking', location = 'BKC, Bandra East, Mumbai' WHERE id = 'site_dp_basement';

    UPDATE "vendors" SET name = 'UltraTech Cement Distributors', contact_person = 'Rajesh Agarwal', phone = '+91-22-28765432', email = 'sales@ultratech-dist.in' WHERE id = 'vend_cement_co';
    UPDATE "vendors" SET name = 'Tata Tiscon Steel Hub', contact_person = 'Sunil Verma', phone = '+91-22-27891234', email = 'orders@tatasteel-hub.in' WHERE id = 'vend_steel_co';
    UPDATE "vendors" SET name = 'Deccan Aggregates & Stone Crusher', contact_person = 'Harish Patil', phone = '+91-20-23456789', email = 'info@deccanaggregates.in' WHERE id = 'vend_aggregate';
    UPDATE "vendors" SET name = 'Bharat Red Brick Works', contact_person = 'Anil Deshmukh', phone = '+91-22-24456789', email = 'sales@bharatbricks.in' WHERE id = 'vend_brick_co';
    UPDATE "vendors" SET name = 'Shree Ram Heavy Cranes & Equipment', contact_person = 'Tarun Mishra', phone = '+91-9820998877', email = 'info@shreeramcranes.in' WHERE id = 'vend_crane_co';

    UPDATE "crm_leads" SET city = 'Mumbai', notes = 'Interested in 3BHK penthouse at Downtown Commercial Plaza' WHERE id = 'lead_crm_1';
    UPDATE "crm_leads" SET city = 'Bengaluru', notes = 'Looking for 2 commercial units at Downtown Plaza' WHERE id = 'lead_crm_2';
    UPDATE "crm_leads" SET city = 'Delhi NCR', notes = 'Discussing payment schedules for commercial floor' WHERE id = 'lead_crm_3';
    UPDATE "crm_leads" SET city = 'Mumbai', notes = 'Booked Retail Unit 102 at Downtown Plaza' WHERE id = 'lead_crm_4';
    UPDATE "crm_leads" SET city = 'Pune', notes = 'Initial enquiry via Digital Ad' WHERE id = 'lead_crm_5';

    UPDATE "crm_deals" SET project_id = 'proj_downtown_plaza', property_name = 'Downtown Plaza - Retail Unit 102', customer_name = 'Meera Patel' WHERE id = 'deal_crm_1';

    UPDATE "crm_properties" SET name = 'Downtown Plaza 3BHK Luxury Office Suite', address = 'BKC, G Block, Bandra East, Mumbai', project_id = 'proj_downtown_plaza' WHERE id = 'prop_crm_1';
    UPDATE "crm_properties" SET name = 'Downtown Executive IT Floor', address = 'BKC, G Block, Bandra East, Mumbai', project_id = 'proj_downtown_plaza' WHERE id = 'prop_crm_2';
    UPDATE "crm_properties" SET name = 'Downtown Ground Floor Premium Retail', address = 'BKC, G Block, Bandra East, Mumbai', project_id = 'proj_downtown_plaza' WHERE id = 'prop_crm_3';
  `);

  console.log('✅ Updated all users, projects, sites, vendors, and CRM to Indian data!');
  await client.end();
}

main().catch(console.error);
