const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const idsToDelete = ['cms30d1hz0001jr04yq9n0j9o', 'proj_gulshan_residency', 'proj_dha_villas'];

  for (const id of idsToDelete) {
    console.log(`Deleting ${id}...`);
    // Delete in child-to-parent order
    await prisma.$executeRawUnsafe(`DELETE FROM inventory_transactions WHERE item_id IN (SELECT id FROM inventory_items WHERE site_id IN (SELECT id FROM sites WHERE project_id = '${id}'))`).catch(() => {});
    await prisma.$executeRawUnsafe(`DELETE FROM inventory_items WHERE site_id IN (SELECT id FROM sites WHERE project_id = '${id}')`).catch(() => {});
    await prisma.$executeRawUnsafe(`DELETE FROM material_consumptions WHERE site_id IN (SELECT id FROM sites WHERE project_id = '${id}')`).catch(() => {});
    await prisma.$executeRawUnsafe(`DELETE FROM material_issue_items WHERE issue_id IN (SELECT id FROM material_issues WHERE site_id IN (SELECT id FROM sites WHERE project_id = '${id}') OR project_id = '${id}')`).catch(() => {});
    await prisma.$executeRawUnsafe(`DELETE FROM material_issues WHERE site_id IN (SELECT id FROM sites WHERE project_id = '${id}') OR project_id = '${id}'`).catch(() => {});
    await prisma.$executeRawUnsafe(`DELETE FROM material_request_items WHERE request_id IN (SELECT id FROM material_requests WHERE site_id IN (SELECT id FROM sites WHERE project_id = '${id}'))`).catch(() => {});
    await prisma.$executeRawUnsafe(`DELETE FROM material_requests WHERE site_id IN (SELECT id FROM sites WHERE project_id = '${id}')`).catch(() => {});
    await prisma.$executeRawUnsafe(`DELETE FROM grn_items WHERE grn_id IN (SELECT id FROM goods_receipt_notes WHERE site_id IN (SELECT id FROM sites WHERE project_id = '${id}') OR po_id IN (SELECT id FROM purchase_orders WHERE project_id = '${id}'))`).catch(() => {});
    await prisma.$executeRawUnsafe(`DELETE FROM goods_receipt_notes WHERE site_id IN (SELECT id FROM sites WHERE project_id = '${id}') OR po_id IN (SELECT id FROM purchase_orders WHERE project_id = '${id}')`).catch(() => {});
    await prisma.$executeRawUnsafe(`DELETE FROM payments WHERE invoice_id IN (SELECT id FROM invoices WHERE project_id = '${id}') OR po_id IN (SELECT id FROM purchase_orders WHERE project_id = '${id}')`).catch(() => {});
    await prisma.$executeRawUnsafe(`DELETE FROM purchase_order_items WHERE po_id IN (SELECT id FROM purchase_orders WHERE project_id = '${id}')`).catch(() => {});
    await prisma.$executeRawUnsafe(`DELETE FROM purchase_orders WHERE project_id = '${id}'`).catch(() => {});
    await prisma.$executeRawUnsafe(`DELETE FROM quotation_items WHERE quotation_id IN (SELECT id FROM quotations WHERE rfq_id IN (SELECT id FROM rfqs WHERE project_id = '${id}'))`).catch(() => {});
    await prisma.$executeRawUnsafe(`DELETE FROM quotations WHERE rfq_id IN (SELECT id FROM rfqs WHERE project_id = '${id}')`).catch(() => {});
    await prisma.$executeRawUnsafe(`DELETE FROM rfq_items WHERE rfq_id IN (SELECT id FROM rfqs WHERE project_id = '${id}')`).catch(() => {});
    await prisma.$executeRawUnsafe(`DELETE FROM rfqs WHERE project_id = '${id}'`).catch(() => {});
    await prisma.$executeRawUnsafe(`DELETE FROM invoice_items WHERE invoice_id IN (SELECT id FROM invoices WHERE project_id = '${id}')`).catch(() => {});
    await prisma.$executeRawUnsafe(`DELETE FROM invoices WHERE project_id = '${id}'`).catch(() => {});
    await prisma.$executeRawUnsafe(`DELETE FROM labour_logs WHERE site_id IN (SELECT id FROM sites WHERE project_id = '${id}')`).catch(() => {});
    await prisma.$executeRawUnsafe(`DELETE FROM worker_attendances WHERE site_id IN (SELECT id FROM sites WHERE project_id = '${id}')`).catch(() => {});
    await prisma.$executeRawUnsafe(`DELETE FROM site_attendances WHERE site_id IN (SELECT id FROM sites WHERE project_id = '${id}')`).catch(() => {});
    await prisma.$executeRawUnsafe(`DELETE FROM worker_transfers WHERE from_site_id IN (SELECT id FROM sites WHERE project_id = '${id}') OR to_site_id IN (SELECT id FROM sites WHERE project_id = '${id}')`).catch(() => {});
    await prisma.$executeRawUnsafe(`UPDATE workers SET labour_team_id = NULL WHERE labour_team_id IN (SELECT id FROM labour_teams WHERE site_id IN (SELECT id FROM sites WHERE project_id = '${id}'))`).catch(() => {});
    await prisma.$executeRawUnsafe(`DELETE FROM labour_teams WHERE site_id IN (SELECT id FROM sites WHERE project_id = '${id}')`).catch(() => {});
    await prisma.$executeRawUnsafe(`UPDATE workers SET site_id = NULL, project_id = NULL WHERE project_id = '${id}' OR site_id IN (SELECT id FROM sites WHERE project_id = '${id}')`).catch(() => {});
    await prisma.$executeRawUnsafe(`DELETE FROM site_assignments WHERE site_id IN (SELECT id FROM sites WHERE project_id = '${id}')`).catch(() => {});
    await prisma.$executeRawUnsafe(`DELETE FROM project_assignments WHERE project_id = '${id}'`).catch(() => {});
    await prisma.$executeRawUnsafe(`DELETE FROM daily_reports WHERE project_id = '${id}' OR site_id IN (SELECT id FROM sites WHERE project_id = '${id}')`).catch(() => {});
    await prisma.$executeRawUnsafe(`DELETE FROM weekly_reports WHERE project_id = '${id}' OR site_id IN (SELECT id FROM sites WHERE project_id = '${id}')`).catch(() => {});
    await prisma.$executeRawUnsafe(`DELETE FROM tasks WHERE project_id = '${id}' OR site_id IN (SELECT id FROM sites WHERE project_id = '${id}')`).catch(() => {});
    await prisma.$executeRawUnsafe(`DELETE FROM milestones WHERE project_id = '${id}'`).catch(() => {});
    await prisma.$executeRawUnsafe(`DELETE FROM project_delays WHERE project_id = '${id}'`).catch(() => {});
    await prisma.$executeRawUnsafe(`DELETE FROM project_risks WHERE project_id = '${id}'`).catch(() => {});
    await prisma.$executeRawUnsafe(`DELETE FROM change_orders WHERE project_id = '${id}'`).catch(() => {});
    await prisma.$executeRawUnsafe(`DELETE FROM budgets WHERE project_id = '${id}' OR site_id IN (SELECT id FROM sites WHERE project_id = '${id}')`).catch(() => {});
    await prisma.$executeRawUnsafe(`DELETE FROM expenses WHERE project_id = '${id}' OR site_id IN (SELECT id FROM sites WHERE project_id = '${id}')`).catch(() => {});
    await prisma.$executeRawUnsafe(`DELETE FROM cashbook WHERE project_id = '${id}' OR site_id IN (SELECT id FROM sites WHERE project_id = '${id}')`).catch(() => {});
    await prisma.$executeRawUnsafe(`UPDATE equipment SET site_id = NULL, project_id = NULL WHERE project_id = '${id}' OR site_id IN (SELECT id FROM sites WHERE project_id = '${id}')`).catch(() => {});
    await prisma.$executeRawUnsafe(`DELETE FROM project_units WHERE project_id = '${id}'`).catch(() => {});
    await prisma.$executeRawUnsafe(`DELETE FROM crm_deals WHERE project_id = '${id}'`).catch(() => {});
    await prisma.$executeRawUnsafe(`DELETE FROM crm_activities WHERE project_id = '${id}'`).catch(() => {});
    await prisma.$executeRawUnsafe(`DELETE FROM crm_leads WHERE project_id = '${id}'`).catch(() => {});
    await prisma.$executeRawUnsafe(`DELETE FROM crm_properties WHERE project_id = '${id}'`).catch(() => {});
    await prisma.$executeRawUnsafe(`DELETE FROM boq_items WHERE category_id IN (SELECT id FROM boq_categories WHERE boq_id IN (SELECT id FROM boqs WHERE project_id = '${id}'))`).catch(() => {});
    await prisma.$executeRawUnsafe(`DELETE FROM boq_categories WHERE boq_id IN (SELECT id FROM boqs WHERE project_id = '${id}')`).catch(() => {});
    await prisma.$executeRawUnsafe(`DELETE FROM boqs WHERE project_id = '${id}'`).catch(() => {});
    await prisma.$executeRawUnsafe(`DELETE FROM sites WHERE project_id = '${id}'`).catch(() => {});
    await prisma.$executeRawUnsafe(`DELETE FROM projects WHERE id = '${id}'`).catch(() => {});
    console.log(`✅ Finished ${id}`);
  }

  const projects = await prisma.project.findMany({ select: { id: true, name: true, company_id: true } });
  console.log('\nFinal projects in DB:');
  console.table(projects);
}

main().finally(() => prisma.$disconnect());
