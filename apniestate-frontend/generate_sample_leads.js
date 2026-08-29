const XLSX = require('./node_modules/xlsx');
const path = require('path');
const fs = require('fs');

const leadsData = [
  {
    "Full Name": "Aarav Mehta",
    "Mobile Number": "+91 98201 12345",
    "Email Address": "aarav.mehta@gmail.com",
    "Budget": "₹1.25 Cr",
    "Location": "Mumbai, Bandra West",
    "Lead Status": "NEW",
    "Priority": "HIGH",
    "Lead Type": "BUYER",
    "Source": "MagicBricks",
    "Requirement": "Looking for 3BHK ready to move with car parking",
    "Preferred Floor": "Above 10th Floor",
    "Possession Year": "2026"
  },
  {
    "Full Name": "Pooja Sharma",
    "Mobile Number": "+91 98192 67890",
    "Email Address": "pooja.sharma@yahoo.com",
    "Budget": "₹85 Lakhs",
    "Location": "Pune, Baner",
    "Lead Status": "CONTACTED",
    "Priority": "MEDIUM",
    "Lead Type": "BUYER",
    "Source": "99acres",
    "Requirement": "2BHK garden facing or balcony",
    "Preferred Floor": "Middle Floors",
    "Possession Year": "2026"
  },
  {
    "Full Name": "Rajesh Singhania",
    "Mobile Number": "+91 99300 45678",
    "Email Address": "singhania.invest@gmail.com",
    "Budget": "₹3.5 Cr",
    "Location": "Bangalore, Indiranagar",
    "Lead Status": "QUALIFIED",
    "Priority": "HIGH",
    "Lead Type": "INVESTOR",
    "Source": "Referral",
    "Requirement": "Commercial retail space with high rental yield",
    "Preferred Floor": "Ground Floor",
    "Possession Year": "Immediate"
  },
  {
    "Full Name": "Kunal Deshmukh (Fewer Attributes Example)",
    "Mobile Number": "+91 97654 32100",
    "Email Address": "",
    "Budget": "₹60 Lakhs",
    "Location": "Navi Mumbai, Vashi",
    "Lead Status": "",
    "Priority": "",
    "Lead Type": "",
    "Source": "Walk-in",
    "Requirement": "",
    "Preferred Floor": "",
    "Possession Year": ""
  },
  {
    "Full Name": "Sunita Rao (Extra Attributes Example)",
    "Mobile Number": "+91 98877 11223",
    "Email Address": "sunita.rao@outlook.com",
    "Budget": "₹95 Lakhs",
    "Location": "Hyderabad, Gachibowli",
    "Lead Status": "SITE_VISIT",
    "Priority": "HIGH",
    "Lead Type": "BUYER",
    "Source": "Website",
    "Requirement": "3BHK near IT park",
    "Preferred Floor": "5th to 8th",
    "Possession Year": "Ready",
    "Assigned Broker": "Deepak Kumar",
    "Loan Preapproved": "Yes - HDFC Bank (₹70 Lakhs)"
  }
];

// 1. Write Excel (.xlsx) to both root and public folders
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(leadsData);
XLSX.utils.book_append_sheet(wb, ws, "CRM_Leads");

const outputPathXlsx = path.resolve(__dirname, '..', 'sample_crm_leads.xlsx');
XLSX.writeFile(wb, outputPathXlsx);
console.log('Created sample Excel file at:', outputPathXlsx);

// 2. Write CSV (.csv) to root
const csvContent = XLSX.utils.sheet_to_csv(ws);
const outputPathCsv = path.resolve(__dirname, '..', 'sample_crm_leads.csv');
fs.writeFileSync(outputPathCsv, csvContent, 'utf-8');
console.log('Created sample CSV file at:', outputPathCsv);
