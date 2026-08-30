const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const keepProjectIds = [
    'proj_downtown_plaza',
    'proj_starter_horizon',
    'proj_growth_residency_1',
    'proj_growth_residency_2',
    'proj_growth_plaza',
  ];

  const allProjects = await prisma.project.findMany({
    select: { id: true, name: true },
  });

  const toDelete = allProjects.filter(p => !keepProjectIds.includes(p.id));
  console.log(`Found ${toDelete.length} extra projects to remove...`);

  for (const p of toDelete) {
    const id = p.id;
    console.log(`Deleting ${p.name} (${id})...`);

    const queries = [
      // 1. Inventory
      `DELETE FROM inventory_transactions WHERE item_id IN (SELECT id FROM inventory_items WHERE site_id IN (SELECT id FROM sites WHERE project_id = '${id}'))`,
      `DELETE FROM inventory_items WHERE site_id IN (SELECT id FROM sites WHERE project_id = '${id}')`,
      `DELETE FROM material_consumptions WHERE site_id IN (SELECT id FROM sites WHERE project_id = '${id}')`,
      
      // 2. Material issues & requests
      `DELETE FROM material_issue_items WHERE issue_id IN (SELECT id FROM material_issues WHERE site_id IN (SELECT id FROM sites WHERE project_id = '${id}') OR project_id = '${id}')`,
      `DELETE FROM material_issues WHERE site_id IN (SELECT id FROM sites WHERE project_id = '${id}') OR project_id = '${id}'`,
      `DELETE FROM material_request_items WHERE request_id IN (SELECT id FROM material_requests WHERE site_id IN (SELECT id FROM sites WHERE project_id = '${id}'))`,
      `DELETE FROM material_requests WHERE site_id IN (SELECT id FROM sites WHERE project_id = '${id}')`,

      // 3. Procurement
      `DELETE FROM grn_items WHERE grn_id IN (SELECT id FROM goods_receipt_notes WHERE site_id IN (SELECT id FROM sites WHERE project_id = '${id}') OR po_id IN (SELECT id FROM purchase_orders WHERE project_id = '${id}' OR site_id IN (SELECT id FROM sites WHERE project_id = '${id}')))`,
      `DELETE FROM goods_receipt_notes WHERE site_id IN (SELECT id FROM sites WHERE project_id = '${id}') OR po_id IN (SELECT id FROM purchase_orders WHERE project_id = '${id}' OR site_id IN (SELECT id FROM sites WHERE project_id = '${id}'))`,
      `DELETE FROM payments WHERE invoice_id IN (SELECT id FROM invoices WHERE project_id = '${id}') OR po_id IN (SELECT id FROM purchase_orders WHERE project_id = '${id}' OR site_id IN (SELECT id FROM sites WHERE project_id = '${id}'))`,
      `DELETE FROM purchase_order_items WHERE po_id IN (SELECT id FROM purchase_orders WHERE project_id = '${id}' OR site_id IN (SELECT id FROM sites WHERE project_id = '${id}'))`,
      `DELETE FROM purchase_orders WHERE project_id = '${id}' OR site_id IN (SELECT id FROM sites WHERE project_id = '${id}')`,
      `DELETE FROM quotation_items WHERE quotation_id IN (SELECT id FROM quotations WHERE rfq_id IN (SELECT id FROM rfqs WHERE project_id = '${id}' OR site_id IN (SELECT id FROM sites WHERE project_id = '${id}')))`,
      `DELETE FROM quotations WHERE rfq_id IN (SELECT id FROM rfqs WHERE project_id = '${id}' OR site_id IN (SELECT id FROM sites WHERE project_id = '${id}'))`,
      `DELETE FROM rfq_items WHERE rfq_id IN (SELECT id FROM rfqs WHERE project_id = '${id}' OR site_id IN (SELECT id FROM sites WHERE project_id = '${id}'))`,
      `DELETE FROM rfqs WHERE project_id = '${id}' OR site_id IN (SELECT id FROM sites WHERE project_id = '${id}')`,
      `DELETE FROM invoice_items WHERE invoice_id IN (SELECT id FROM invoices WHERE project_id = '${id}')`,
      `DELETE FROM invoices WHERE project_id = '${id}'`,

      // 4. Workers & Labour
      `DELETE FROM labour_logs WHERE site_id IN (SELECT id FROM sites WHERE project_id = '${id}')`,
      `DELETE FROM worker_attendances WHERE site_id IN (SELECT id FROM sites WHERE project_id = '${id}')`,
      `DELETE FROM site_attendances WHERE site_id IN (SELECT id FROM sites WHERE project_id = '${id}')`,
      `DELETE FROM worker_transfers WHERE from_site_id IN (SELECT id FROM sites WHERE project_id = '${id}') OR to_site_id IN (SELECT id FROM sites WHERE project_id = '${id}')`,
      `UPDATE workers SET labour_team_id = NULL WHERE labour_team_id IN (SELECT id FROM labour_teams WHERE site_id IN (SELECT id FROM sites WHERE project_id = '${id}'))`,
      `DELETE FROM labour_teams WHERE site_id IN (SELECT id FROM sites WHERE project_id = '${id}')`,
      `UPDATE workers SET site_id = NULL, project_id = NULL WHERE project_id = '${id}' OR site_id IN (SELECT id FROM sites WHERE project_id = '${id}')`,
      `DELETE FROM site_assignments WHERE site_id IN (SELECT id FROM sites WHERE project_id = '${id}')`,
      `DELETE FROM project_assignments WHERE project_id = '${id}'`,

      // 5. Reports & Tracking
      `DELETE FROM daily_reports WHERE project_id = '${id}' OR site_id IN (SELECT id FROM sites WHERE project_id = '${id}')`,
      `DELETE FROM weekly_reports WHERE project_id = '${id}' OR site_id IN (SELECT id FROM sites WHERE project_id = '${id}')`,
      `DELETE FROM tasks WHERE project_id = '${id}' OR site_id IN (SELECT id FROM sites WHERE project_id = '${id}')`,
      `DELETE FROM milestones WHERE project_id = '${id}'`,
      `DELETE FROM project_delays WHERE project_id = '${id}'`,
      `DELETE FROM project_risks WHERE project_id = '${id}'`,
      `DELETE FROM change_orders WHERE project_id = '${id}'`,
      `DELETE FROM budgets WHERE project_id = '${id}' OR site_id IN (SELECT id FROM sites WHERE project_id = '${id}')`,
      `DELETE FROM expenses WHERE project_id = '${id}' OR site_id IN (SELECT id FROM sites WHERE project_id = '${id}')`,
      `DELETE FROM cashbook WHERE project_id = '${id}' OR site_id IN (SELECT id FROM sites WHERE project_id = '${id}')`,
      `UPDATE equipment SET site_id = NULL, project_id = NULL WHERE project_id = '${id}' OR site_id IN (SELECT id FROM sites WHERE project_id = '${id}')`,
      `DELETE FROM project_units WHERE project_id = '${id}'`,

      // 6. CRM
      `DELETE FROM crm_deals WHERE project_id = '${id}'`,
      `DELETE FROM crm_activities WHERE project_id = '${id}'`,
      `DELETE FROM crm_leads WHERE project_id = '${id}'`,
      `DELETE FROM crm_properties WHERE project_id = '${id}'`,

      // 7. BOQs
      `DELETE FROM boq_items WHERE category_id IN (SELECT id FROM boq_categories WHERE boq_id IN (SELECT id FROM boqs WHERE project_id = '${id}'))`,
      `DELETE FROM boq_categories WHERE boq_id IN (SELECT id FROM boqs WHERE project_id = '${id}')`,
      `DELETE FROM boqs WHERE project_id = '${id}'`,

      // 8. Sites & Project
      `DELETE FROM sites WHERE project_id = '${id}'`,
      `DELETE FROM projects WHERE id = '${id}'`,
    ];

    for (const q of queries) {
      try {
        await prisma.$executeRawUnsafe(q);
      } catch (e) {
        // Continue
      }
    }
    console.log(`✅ Deleted ${p.name}`);
  }

  const remaining = await prisma.project.findMany({
    select: { id: true, name: true, company_id: true, status: true },
  });
  console.log('\n✨ Remaining projects in database:');
  console.table(remaining);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
