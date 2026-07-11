import { prisma } from "@/lib/prisma";

export async function getCostIntelligenceForProject(project_id: string, company_id?: string) {
  // 1. Get the latest approved BOQ for Estimates
  const boq = await prisma.bOQ.findFirst({
    where: { project_id, status: 'APPROVED' },
    orderBy: { version: 'desc' },
  });

  const estimatedBudget = boq?.total_estimated_cost || 0;

  // 2. Aggregate Actual Material Cost (from MaterialConsumptions linked to project's sites)
  // But MaterialConsumption only has quantity, not rate. The rate comes from Material or BOQ.
  // For simplicity, we can fetch all consumptions and multiply by material rate if available, 
  // or we can just query Expenses where category = MATERIAL.
  // Wait, if we use Expense for everything, we avoid complex rate lookups. Let's use Expenses for Overheads/Equipment,
  // and Purchase Orders for Materials.
  
  // Aggregate Purchase Orders (Committed/Spent)
  const poAgg = await prisma.purchaseOrder.aggregate({
    where: { project_id, status: { in: ['APPROVED', 'SENT', 'PARTIAL', 'DELIVERED'] } },
    _sum: { total_amount: true }
  });
  const materialCost = poAgg._sum.total_amount || 0;

  // Aggregate Labour (WorkerWages for workers assigned to this project)
  // WorkerWage doesn't link to project directly, it links to worker, worker links to project
  const wages = await prisma.workerWage.aggregate({
    where: { worker: { project_id } },
    _sum: { net_amount: true }
  });
  const labourCost = wages._sum.net_amount || 0;

  // Aggregate Equipment & Overheads from Expense
  const expenses = await prisma.expense.groupBy({
    by: ['category'],
    where: { project_id, status: 'APPROVED' },
    _sum: { amount: true }
  });

  const equipmentCost = expenses.find(e => e.category === 'EQUIPMENT')?._sum.amount || 0;
  const indirectCost = expenses.find(e => e.category === 'OTHER' || e.category === 'OFFICE')?._sum.amount || 0;

  const totalActualCost = materialCost + labourCost + equipmentCost + indirectCost;
  const variance = estimatedBudget - totalActualCost;
  const variancePercentage = estimatedBudget > 0 ? (variance / estimatedBudget) * 100 : 0;

  return {
    estimatedBudget,
    totalActualCost,
    variance,
    variancePercentage,
    breakdown: {
      materialCost,
      labourCost,
      equipmentCost,
      indirectCost
    }
  };
}
