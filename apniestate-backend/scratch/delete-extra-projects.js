const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteProjectCascade(id) {
  const projectSites = await prisma.site.findMany({
    where: { project_id: id },
    select: { id: true }
  });
  const siteIds = projectSites.map(s => s.id);

  const labourTeams = await prisma.labourTeam.findMany({
    where: { site_id: { in: siteIds } },
    select: { id: true }
  });
  const teamIds = labourTeams.map(t => t.id);

  const inventoryItems = await prisma.inventoryItem.findMany({
    where: { site_id: { in: siteIds } },
    select: { id: true }
  });
  const itemIds = inventoryItems.map(i => i.id);

  return prisma.$transaction(async (tx) => {
    // 1. Unassign & delete labour teams
    if (teamIds.length > 0) {
      await tx.worker.updateMany({
        where: { labour_team_id: { in: teamIds } },
        data: { labour_team_id: null }
      });
      await tx.labourTeam.deleteMany({
        where: { id: { in: teamIds } }
      });
    }

    // 2. Unassign workers
    await tx.worker.updateMany({
      where: {
        OR: [
          { project_id: id },
          { site_id: { in: siteIds } }
        ]
      },
      data: { project_id: null, site_id: null }
    });

    // 3. Worker attendances & transfers
    await tx.workerAttendance.deleteMany({ where: { site_id: { in: siteIds } } });
    await tx.siteAttendance.deleteMany({ where: { site_id: { in: siteIds } } });
    await tx.dailyReport.deleteMany({ where: { site_id: { in: siteIds } } });
    await tx.workerTransfer.deleteMany({ where: { OR: [{ from_site_id: { in: siteIds } }, { to_site_id: { in: siteIds } }] } });
    await tx.siteAssignment.deleteMany({ where: { site_id: { in: siteIds } } });
    await tx.projectAssignment.deleteMany({ where: { project_id: id } });

    // 4. Inventory transactions & items
    if (itemIds.length > 0) {
      await tx.inventoryTransaction.deleteMany({ where: { item_id: { in: itemIds } } });
      await tx.inventoryItem.deleteMany({ where: { id: { in: itemIds } } });
    }

    // 5. Material requests & items
    const matRequests = await tx.materialRequest.findMany({ where: { site_id: { in: siteIds } }, select: { id: true } });
    if (matRequests.length > 0) {
      const mrIds = matRequests.map(r => r.id);
      await tx.materialRequestItem.deleteMany({ where: { request_id: { in: mrIds } } });
      await tx.materialRequest.deleteMany({ where: { id: { in: mrIds } } });
    }

    // 6. Procurement: POs, RFQs, Quotes, GRNs, Invoices, Payments
    const pos = await tx.purchaseOrder.findMany({ where: { OR: [{ project_id: id }, { site_id: { in: siteIds } }] }, select: { id: true } });
    const poIds = pos.map(p => p.id);
    if (poIds.length > 0) {
      const grns = await tx.gRN.findMany({ where: { po_id: { in: poIds } }, select: { id: true } });
      const grnIds = grns.map(g => g.id);
      if (grnIds.length > 0) {
        await tx.gRNItem.deleteMany({ where: { grn_id: { in: grnIds } } });
        await tx.gRN.deleteMany({ where: { id: { in: grnIds } } });
      }
      await tx.purchaseOrderItem.deleteMany({ where: { po_id: { in: poIds } } });
      await tx.purchaseOrder.deleteMany({ where: { id: { in: poIds } } });
    }

    const invoices = await tx.invoice.findMany({ where: { project_id: id }, select: { id: true } });
    const invIds = invoices.map(i => i.id);
    if (invIds.length > 0) {
      await tx.payment.deleteMany({ where: { invoice_id: { in: invIds } } });
      await tx.invoiceItem.deleteMany({ where: { invoice_id: { in: invIds } } });
      await tx.invoice.deleteMany({ where: { id: { in: invIds } } });
    }

    const rfqs = await tx.rFQ.findMany({ where: { project_id: id }, select: { id: true } });
    const rfqIds = rfqs.map(r => r.id);
    if (rfqIds.length > 0) {
      const quotes = await tx.quotation.findMany({ where: { rfq_id: { in: rfqIds } }, select: { id: true } });
      const quoteIds = quotes.map(q => q.id);
      if (quoteIds.length > 0) {
        await tx.quotationItem.deleteMany({ where: { quotation_id: { in: quoteIds } } });
        await tx.quotation.deleteMany({ where: { id: { in: quoteIds } } });
      }
      await tx.rFQItem.deleteMany({ where: { rfq_id: { in: rfqIds } } });
      await tx.rFQ.deleteMany({ where: { id: { in: rfqIds } } });
    }

    // 7. Equipment, Milestones, Risks, Delays, ChangeOrders, Tasks, Budgets, Expenses, Cashbook
    await tx.equipment.updateMany({ where: { site_id: { in: siteIds } }, data: { site_id: null } });
    await tx.milestone.deleteMany({ where: { project_id: id } });
    await tx.projectDelay.deleteMany({ where: { project_id: id } });
    await tx.projectRisk.deleteMany({ where: { project_id: id } });
    await tx.changeOrder.deleteMany({ where: { project_id: id } });
    await tx.task.deleteMany({ where: { OR: [{ project_id: id }, { site_id: { in: siteIds } }] } });
    await tx.budget.deleteMany({ where: { OR: [{ project_id: id }, { site_id: { in: siteIds } }] } });
    await tx.expense.deleteMany({ where: { OR: [{ project_id: id }, { site_id: { in: siteIds } }] } });
    await tx.cashbook.deleteMany({ where: { OR: [{ project_id: id }, { site_id: { in: siteIds } }] } });

    // 8. BOQs
    const boqs = await tx.bOQ.findMany({ where: { project_id: id }, select: { id: true } });
    if (boqs.length > 0) {
      const boqIds = boqs.map(b => b.id);
      const categories = await tx.bOQCategory.findMany({ where: { boq_id: { in: boqIds } }, select: { id: true } });
      if (categories.length > 0) {
        await tx.bOQItem.deleteMany({ where: { category_id: { in: categories.map(c => c.id) } } });
      }
      await tx.bOQCategory.deleteMany({ where: { boq_id: { in: boqIds } } });
      await tx.bOQ.deleteMany({ where: { project_id: id } });
    }

    // 9. CRM
    await tx.crmDeal.deleteMany({ where: { project_id: id } }).catch(() => {});
    await tx.crmLead.deleteMany({ where: { project_id: id } }).catch(() => {});
    await tx.crmProperty.deleteMany({ where: { project_id: id } }).catch(() => {});

    // 10. Sites & Project
    await tx.site.deleteMany({ where: { project_id: id } });
    return tx.project.delete({ where: { id } });
  });
}

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
  console.log(`Found ${toDelete.length} extra projects to remove:`);

  for (const p of toDelete) {
    console.log(`Deleting ${p.name} (${p.id})...`);
    try {
      await deleteProjectCascade(p.id);
      console.log(`✅ Successfully deleted ${p.name}`);
    } catch (e) {
      console.error(`❌ Failed to delete ${p.name}:`, e.message);
    }
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
