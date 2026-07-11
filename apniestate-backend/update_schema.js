const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

// 1. Enums Replacement
schema = schema.replace(
  /enum MaterialRequestStatus \{[\s\S]*?\}/,
  `enum MaterialRequestStatus {
  DRAFT
  SUBMITTED
  APPROVED
  REJECTED
  ORDERED
  DELIVERED
  COMPLETED
  CANCELLED
}`
);

schema = schema.replace(
  /enum InventoryTransactionType \{[\s\S]*?\}/,
  `enum InventoryTransactionType {
  IN
  OUT
  ADJUST
  GRN_RECEIPT
  MATERIAL_ISSUE
  RETURN
  DAMAGE
  TRANSFER_IN
  TRANSFER_OUT
}

enum RFQStatus {
  DRAFT
  PUBLISHED
  CLOSED
  CANCELLED
}

enum QuotationStatus {
  DRAFT
  SUBMITTED
  ACCEPTED
  REJECTED
}

enum GRNStatus {
  DRAFT
  VERIFIED
  DISPUTED
}

enum MaterialIssueStatus {
  PENDING
  APPROVED
  ISSUED
  REJECTED
}`
);

// 2. MaterialRequest Replacement
schema = schema.replace(
  /model MaterialRequest \{[\s\S]*?@@map\("material_requests"\)\s*\}/,
  `model MaterialRequest {
  id                     String                @id @default(cuid())
  site_id                String
  material_id            String
  quantity               Float
  approved_quantity      Float?
  assigned_vendor_id     String?
  expected_delivery_date DateTime?             @db.Date
  status                 MaterialRequestStatus @default(DRAFT)
  priority               RequestPriority       @default(NORMAL)
  requested_by           String
  approved_by            String?
  notes                  String?
  created_at             DateTime              @default(now())
  updated_at             DateTime              @updatedAt

  site      Site     @relation(fields: [site_id], references: [id])
  material  Material @relation(fields: [material_id], references: [id])
  requester User     @relation(fields: [requested_by], references: [id])
  approver  User?    @relation("MaterialRequestApprover", fields: [approved_by], references: [id])
  vendor    Vendor?  @relation(fields: [assigned_vendor_id], references: [id])

  @@index([site_id], name: "idx_material_requests_site_id")
  @@index([status], name: "idx_material_requests_status")
  @@map("material_requests")
}`
);

// 3. New Models Append
const newModels = `
// ─── RFQ & Quotations ────────────────────────────────────

model RFQ {
  id           String      @id @default(cuid())
  project_id   String?
  site_id      String?
  company_id   String
  created_by   String
  status       RFQStatus   @default(DRAFT)
  due_date     DateTime?   @db.Date
  notes        String?
  created_at   DateTime    @default(now())
  updated_at   DateTime    @updatedAt

  project      Project?    @relation(fields: [project_id], references: [id])
  site         Site?       @relation(fields: [site_id], references: [id])
  company      Company     @relation(fields: [company_id], references: [id])
  creator      User        @relation(fields: [created_by], references: [id])
  items        RFQItem[]
  quotations   Quotation[]

  @@index([company_id], name: "idx_rfq_company")
  @@map("rfqs")
}

model RFQItem {
  id          String   @id @default(cuid())
  rfq_id      String
  material_id String
  quantity    Float

  rfq         RFQ      @relation(fields: [rfq_id], references: [id], onDelete: Cascade)
  material    Material @relation(fields: [material_id], references: [id])

  @@map("rfq_items")
}

model Quotation {
  id             String          @id @default(cuid())
  rfq_id         String
  vendor_id      String
  status         QuotationStatus @default(DRAFT)
  total_amount   Float           @default(0)
  gst_amount     Float           @default(0)
  transportation Float           @default(0)
  delivery_time  String?
  validity_days  Int?
  terms          String?
  created_at     DateTime        @default(now())
  updated_at     DateTime        @updatedAt

  rfq            RFQ             @relation(fields: [rfq_id], references: [id], onDelete: Cascade)
  vendor         Vendor          @relation(fields: [vendor_id], references: [id])
  items          QuotationItem[]

  @@unique([rfq_id, vendor_id])
  @@map("quotations")
}

model QuotationItem {
  id           String    @id @default(cuid())
  quotation_id String
  material_id  String
  quantity     Float
  rate         Float
  total        Float

  quotation    Quotation @relation(fields: [quotation_id], references: [id], onDelete: Cascade)
  material     Material  @relation(fields: [material_id], references: [id])

  @@map("quotation_items")
}

// ─── Goods Receipt Note (GRN) ────────────────────────────

model GoodsReceiptNote {
  id           String      @id @default(cuid())
  po_id        String
  site_id      String
  received_by  String
  date         DateTime    @default(now())
  status       GRNStatus   @default(DRAFT)
  remarks      String?
  created_at   DateTime    @default(now())
  updated_at   DateTime    @updatedAt

  purchase_order PurchaseOrder @relation(fields: [po_id], references: [id])
  site           Site          @relation(fields: [site_id], references: [id])
  receiver       User          @relation(fields: [received_by], references: [id])
  items          GoodsReceiptNoteItem[]

  @@map("goods_receipt_notes")
}

model GoodsReceiptNoteItem {
  id            String   @id @default(cuid())
  grn_id        String
  material_id   String
  ordered_qty   Float
  received_qty  Float
  rejected_qty  Float    @default(0)
  damaged_qty   Float    @default(0)
  short_supply  Float    @default(0)

  grn           GoodsReceiptNote @relation(fields: [grn_id], references: [id], onDelete: Cascade)
  material      Material         @relation(fields: [material_id], references: [id])

  @@map("goods_receipt_note_items")
}

// ─── Material Issue & Consumption ────────────────────────

model MaterialIssue {
  id           String              @id @default(cuid())
  site_id      String
  requested_by String
  approved_by  String?
  date         DateTime            @default(now())
  purpose      String?
  status       MaterialIssueStatus @default(PENDING)
  created_at   DateTime            @default(now())
  updated_at   DateTime            @updatedAt

  site         Site                @relation(fields: [site_id], references: [id])
  requester    User                @relation("MaterialIssueRequester", fields: [requested_by], references: [id])
  approver     User?               @relation("MaterialIssueApprover", fields: [approved_by], references: [id])
  items        MaterialIssueItem[]

  @@map("material_issues")
}

model MaterialIssueItem {
  id           String        @id @default(cuid())
  issue_id     String
  material_id  String
  quantity     Float

  issue        MaterialIssue @relation(fields: [issue_id], references: [id], onDelete: Cascade)
  material     Material      @relation(fields: [material_id], references: [id])

  @@map("material_issue_items")
}

model MaterialConsumption {
  id           String   @id @default(cuid())
  site_id      String
  material_id  String
  quantity     Float
  date         DateTime @default(now())
  dpr_id       String?
  boq_id       String?
  created_at   DateTime @default(now())

  site         Site     @relation(fields: [site_id], references: [id])
  material     Material @relation(fields: [material_id], references: [id])
  dpr          DailyReport? @relation(fields: [dpr_id], references: [id])

  @@map("material_consumptions")
}
`;

schema = schema.replace(
  /model PurchaseOrderItem \{[\s\S]*?@@map\("purchase_order_items"\)\s*\}/,
  (match) => match + '\n' + newModels
);

// 4. Inject Relations
function injectRelation(modelName, relationString) {
  const regex = new RegExp("(model " + modelName + " \\\\{[\\\\s\\\\S]*?)(  @@|\\\\})");
  schema = schema.replace(regex, (match, p1, p2) => {
    return p1 + relationString + '\\n' + p2;
  });
}

injectRelation('User', `  material_requests_approved MaterialRequest[] @relation("MaterialRequestApprover")
  material_issues_requested MaterialIssue[] @relation("MaterialIssueRequester")
  material_issues_approved MaterialIssue[] @relation("MaterialIssueApprover")
  rfqs_created RFQ[]
  grns_received GoodsReceiptNote[]`);

injectRelation('Company', `  rfqs RFQ[]`);

injectRelation('Project', `  rfqs RFQ[]`);

injectRelation('Site', `  rfqs RFQ[]
  grns GoodsReceiptNote[]
  material_issues MaterialIssue[]
  material_consumptions MaterialConsumption[]`);

injectRelation('PurchaseOrder', `  grns GoodsReceiptNote[]`);

injectRelation('DailyReport', `  material_consumptions MaterialConsumption[]`);

injectRelation('Vendor', `  quotations Quotation[]
  material_requests MaterialRequest[]`);

injectRelation('Material', `  rfq_items RFQItem[]
  quotation_items QuotationItem[]
  grn_items GoodsReceiptNoteItem[]
  issue_items MaterialIssueItem[]
  consumptions MaterialConsumption[]`);

fs.writeFileSync(schemaPath, schema, 'utf8');
console.log('Schema updated successfully.');
