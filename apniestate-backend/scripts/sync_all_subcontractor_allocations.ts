import { prisma } from "../src/lib/prisma";
import { syncSubContractorAllocationToFinanceAndBudget } from "../src/modules/subcontractors/subcontractors.service";

async function main() {
  console.log("=== Step 1: Cleaning up legacy micro-expenses from central Expense ledger ===");
  const deletedOldMicro = await prisma.expense.deleteMany({
    where: {
      reference_id: { startsWith: "subcontractor-expense-" },
    },
  });
  console.log(`Deleted ${deletedOldMicro.count} legacy micro-expenses from central Expense table.`);

  console.log("\n=== Step 2: Fetching all active Sub Contractor assignments ===");
  const assignments = await prisma.subContractorProjectAssignment.findMany({
    include: {
      project: true,
      user: true,
    },
  });
  console.log(`Found ${assignments.length} assignments to process.`);

  for (const a of assignments) {
    console.log(`\nProcessing assignment ${a.id}:`);
    console.log(`  Sub Contractor: ${a.user.name} (${a.user.email})`);
    console.log(`  Project: ${a.project.name} (Budget: ₹${a.project.budget?.toLocaleString()})`);
    console.log(`  Work Type: ${a.work_type}`);
    console.log(`  Allocated Budget: ₹${a.allocated_budget.toLocaleString()}`);

    await syncSubContractorAllocationToFinanceAndBudget(
      {
        id: a.id,
        project_id: a.project_id,
        user_id: a.user_id,
        work_type: a.work_type,
        allocated_budget: a.allocated_budget,
        user: { name: a.user.name },
      },
      a.created_by,
      a.company_id || a.project.company_id
    );
    console.log(`  -> Synced to Central Finance & Budget successfully.`);
  }

  console.log("\n=== Step 3: Verification of Central Finance (Expenses) ===");
  const expenses = await prisma.expense.findMany({
    where: {
      OR: [
        { category: "SUBCONTRACT" },
        { reference_id: { startsWith: "subcontractor-allocation-" } },
      ],
    },
    include: {
      project: { select: { name: true } },
      user: { select: { name: true, role: true } },
    },
  });
  console.log("Central Finance Subcontractor Expenses:");
  expenses.forEach(e => {
    console.log(`- Amount: ₹${e.amount.toLocaleString()}, Project: ${e.project?.name}, Recorded By: ${e.user.name} (${e.user.role}), Status: ${e.status}, Ref: ${e.reference_id}, Desc: ${e.description}`);
  });

  console.log("\n=== Step 4: Verification of Budget Module ===");
  const budgets = await prisma.budget.findMany({
    where: { category: "SUBCONTRACT" },
    include: { project: { select: { name: true } } },
  });
  console.log("Budget Table Entries (SUBCONTRACT):");
  budgets.forEach(b => {
    console.log(`- Project: ${b.project.name}, Allocated: ₹${b.allocated.toLocaleString()}, Spent: ₹${b.spent.toLocaleString()}, Desc: ${b.description}`);
  });

  console.log("\n=== Step 5: Verification of Project Actual Cost & Remaining Budget ===");
  const projectIds = Array.from(new Set(assignments.map(a => a.project_id)));
  const projects = await prisma.project.findMany({
    where: { id: { in: projectIds } },
    select: { id: true, name: true, budget: true, actual_cost: true },
  });
  projects.forEach(p => {
    const remaining = Math.max(0, (p.budget || 0) - (p.actual_cost || 0));
    console.log(`- Project: ${p.name} | Total Budget: ₹${p.budget?.toLocaleString()} | Actual Cost (Spent/Committed): ₹${p.actual_cost?.toLocaleString()} | Remaining Budget: ₹${remaining.toLocaleString()}`);
  });
}

main()
  .catch((err) => {
    console.error("Migration error:", err);
  })
  .finally(() => prisma.$disconnect());
