const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Updating database records to Indian details...');

  // 1. Update Users
  await prisma.user.updateMany({
    where: { email: 'admin@gmail.com' },
    data: { name: 'Aditya Sharma', phone: '+91-9820112233', city: 'Mumbai', state: 'Maharashtra' }
  });
  await prisma.user.updateMany({
    where: { email: 'builder@apniestate.com' },
    data: { name: 'Aditya Sharma (Alt)', phone: '+91-9820112234', city: 'Mumbai', state: 'Maharashtra' }
  });
  await prisma.user.updateMany({
    where: { email: 'starter@apniestate.com' },
    data: { name: 'Suresh Patel', phone: '+91-9876543210', city: 'Gurugram', state: 'Haryana' }
  });
  await prisma.user.updateMany({
    where: { email: 'growth@apniestate.com' },
    data: { name: 'Gaurav Singhal', phone: '+91-9876543220', city: 'Noida', state: 'Uttar Pradesh' }
  });
  await prisma.user.updateMany({
    where: { email: 'pm1@apniestate.com' },
    data: { name: 'Rohan Mehra', phone: '+91-9820223344' }
  });
  await prisma.user.updateMany({
    where: { email: 'pm2@apniestate.com' },
    data: { name: 'Pooja Iyer', phone: '+91-9820334455' }
  });
  await prisma.user.updateMany({
    where: { email: 'sup1@apniestate.com' },
    data: { name: 'Vikram Joshi', phone: '+91-9820445566' }
  });
  await prisma.user.updateMany({
    where: { email: 'sup2@apniestate.com' },
    data: { name: 'Amitabh Gupta', phone: '+91-9820556677' }
  });
  await prisma.user.updateMany({
    where: { email: 'sup3@apniestate.com' },
    data: { name: 'Suresh Rao', phone: '+91-9820667788' }
  });
  await prisma.user.updateMany({
    where: { email: 'accounts@apniestate.com' },
    data: { name: 'Neha Kulkarni', phone: '+91-9820778899' }
  });

  // 2. Update Project & Sites
  await prisma.project.updateMany({
    where: { id: 'proj_downtown_plaza' },
    data: {
      name: 'Downtown Commercial Plaza',
      description: 'A 12-story G+11 premium commercial IT & business park',
      address: 'Bandra Kurla Complex (BKC), G Block',
      city: 'Mumbai'
    }
  });

  await prisma.site.updateMany({
    where: { id: 'site_dp_tower' },
    data: { name: 'Downtown Plaza — Tower Block', location: 'BKC, Bandra East, Mumbai' }
  });
  await prisma.site.updateMany({
    where: { id: 'site_dp_basement' },
    data: { name: 'Downtown Plaza — Basement & Parking', location: 'BKC, Bandra East, Mumbai' }
  });

  // 3. Update Vendors
  const vendors = [
    { id: 'vend_cement_co', name: 'UltraTech Cement Distributors', contact_person: 'Rajesh Agarwal', phone: '+91-22-28765432', email: 'sales@ultratech-dist.in' },
    { id: 'vend_steel_co', name: 'Tata Tiscon Steel Hub', contact_person: 'Sunil Verma', phone: '+91-22-27891234', email: 'orders@tatasteel-hub.in' },
    { id: 'vend_aggregate', name: 'Deccan Aggregates & Stone Crusher', contact_person: 'Harish Patil', phone: '+91-20-23456789', email: 'info@deccanaggregates.in' },
    { id: 'vend_brick_co', name: 'Bharat Red Brick Works', contact_person: 'Anil Deshmukh', phone: '+91-22-24456789', email: 'sales@bharatbricks.in' },
    { id: 'vend_crane_co', name: 'Shree Ram Heavy Cranes & Equipment', contact_person: 'Tarun Mishra', phone: '+91-9820998877', email: 'info@shreeramcranes.in' },
  ];
  for (const v of vendors) {
    await prisma.vendor.updateMany({ where: { id: v.id }, data: v });
  }

  // 4. Update Workers
  const workerNames = [
    'Ramesh Kumar', 'Suresh Sharma', 'Mahesh Verma', 'Dinesh Gupta', 'Mukesh Yadav', 'Rajesh Patel', 'Ganesh Joshi', 'Rakesh Singh', 'Naresh Pandey', 'Pankaj Mishra',
    'Santosh Chauhan', 'Manoj Tiwari', 'Sunil Saini', 'Anil Rawat', 'Deepak Maurya', 'Vinod Prajapati', 'Ajay Thakur', 'Vijay Rathore', 'Ashok Bind', 'Kishore Sonkar',
    'Brijesh Paswan', 'Dharmendra Gautam', 'Ram Sevak', 'Shiv Kumar', 'Gopal Das', 'Harish Chandra', 'Kishan Lal', 'Mohan Lal', 'Bhola Nath', 'Shyam Sundar',
    'Jagdish Prasad', 'Om Prakash', 'Radhey Shyam', 'Chandra Prakash', 'Suraj Pal', 'Hemant Kumar', 'Kundan Singh', 'Lalit Mohan', 'Devendra Kumar', 'Pravin Shinde',
    'Sanjay Kamble', 'Nitin Gaikwad', 'Sachin More', 'Rahul Jadhav', 'Vikas Sawant', 'Pradeep Pawar', 'Sandip Kadam', 'Kiran Shirodkar', 'Amol Deshpande', 'Girish Kulkarni',
    'Tushar Joshi', 'Vishal Mane'
  ];
  const allWorkers = await prisma.worker.findMany({ select: { id: true } });
  for (let i = 0; i < allWorkers.length; i++) {
    const w = allWorkers[i];
    const name = workerNames[i % workerNames.length];
    const phone = `+91-${9800000000 + i * 179}`;
    await prisma.worker.update({ where: { id: w.id }, data: { name, phone } });
  }

  // 5. Update CRM
  await prisma.crmLead.updateMany({
    where: { id: 'lead_crm_1' },
    data: { city: 'Mumbai', notes: 'Interested in 3BHK penthouse at Downtown Commercial Plaza' }
  });
  await prisma.crmLead.updateMany({
    where: { id: 'lead_crm_2' },
    data: { city: 'Bengaluru', notes: 'Looking for 2 commercial units at Downtown Plaza' }
  });
  await prisma.crmLead.updateMany({
    where: { id: 'lead_crm_3' },
    data: { city: 'Delhi NCR', notes: 'Discussing payment schedules for commercial floor' }
  });
  await prisma.crmLead.updateMany({
    where: { id: 'lead_crm_4' },
    data: { city: 'Mumbai', notes: 'Booked Retail Unit 102 at Downtown Plaza' }
  });
  await prisma.crmLead.updateMany({
    where: { id: 'lead_crm_5' },
    data: { city: 'Pune', notes: 'Initial enquiry via Digital Ad' }
  });

  // CRM Deal
  await prisma.crmDeal.updateMany({
    where: { id: 'deal_crm_1' },
    data: {
      project_id: 'proj_downtown_plaza',
      property_name: 'Downtown Plaza - Retail Unit 102',
      customer_name: 'Meera Patel',
    }
  });

  // CRM Properties
  await prisma.crmProperty.updateMany({
    where: { id: 'prop_crm_1' },
    data: { name: 'Downtown Plaza 3BHK Luxury Office Suite', address: 'BKC, G Block, Bandra East, Mumbai', project_id: 'proj_downtown_plaza' }
  });
  await prisma.crmProperty.updateMany({
    where: { id: 'prop_crm_2' },
    data: { name: 'Downtown Executive IT Floor', address: 'BKC, G Block, Bandra East, Mumbai', project_id: 'proj_downtown_plaza' }
  });
  await prisma.crmProperty.updateMany({
    where: { id: 'prop_crm_3' },
    data: { name: 'Downtown Ground Floor Premium Retail', address: 'BKC, G Block, Bandra East, Mumbai', project_id: 'proj_downtown_plaza' }
  });

  console.log('✅ Database successfully updated to Indian context!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
