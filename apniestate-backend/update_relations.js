const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

// 1. User
schema = schema.replace(
  /@@map\("users"\)/,
  `material_requests_approved MaterialRequest[] @relation("MaterialRequestApprover")
  material_issues_requested MaterialIssue[] @relation("MaterialIssueRequester")
  material_issues_approved MaterialIssue[] @relation("MaterialIssueApprover")
  rfqs_created RFQ[]
  grns_received GoodsReceiptNote[]
  @@map("users")`
);

// 2. Company
schema = schema.replace(
  /@@map\("companies"\)/,
  `rfqs RFQ[]
  @@map("companies")`
);

// 3. Project
schema = schema.replace(
  /@@map\("projects"\)/,
  `rfqs RFQ[]
  @@map("projects")`
);

// 4. Site
schema = schema.replace(
  /@@map\("sites"\)/,
  `rfqs RFQ[]
  grns GoodsReceiptNote[]
  material_issues MaterialIssue[]
  material_consumptions MaterialConsumption[]
  @@map("sites")`
);

// 5. PurchaseOrder
schema = schema.replace(
  /@@map\("purchase_orders"\)/,
  `grns GoodsReceiptNote[]
  @@map("purchase_orders")`
);

// 6. DailyReport
schema = schema.replace(
  /@@map\("daily_reports"\)/,
  `material_consumptions MaterialConsumption[]
  @@map("daily_reports")`
);

// 7. Vendor
schema = schema.replace(
  /@@map\("vendors"\)/,
  `quotations Quotation[]
  material_requests MaterialRequest[]
  @@map("vendors")`
);

// 8. Material
schema = schema.replace(
  /@@map\("materials"\)/,
  `rfq_items RFQItem[]
  quotation_items QuotationItem[]
  grn_items GoodsReceiptNoteItem[]
  issue_items MaterialIssueItem[]
  consumptions MaterialConsumption[]
  @@map("materials")`
);

fs.writeFileSync(schemaPath, schema, 'utf8');
console.log('Relations injected via targeted replace successfully.');
