import { prisma } from "@/lib/prisma";

export async function getCashbook(startDate?: string, endDate?: string, siteId?: string) {
  const where: any = {};
  
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  // Not directly linked to site in schema, but we'll return all for now or we could add siteId if it existed
  const entries = await prisma.cashbook.findMany({
    where,
    orderBy: { date: 'desc' },
    include: {
      recorder: { select: { name: true } }
    }
  });

  // Calculate opening, received, spent, and balance
  let cashReceived = 0;
  let cashSpent = 0;

  entries.forEach(entry => {
    if (entry.type === 'CREDIT') cashReceived += entry.amount;
    else if (entry.type === 'DEBIT') cashSpent += entry.amount;
  });

  return {
    openingBalance: 0, // Mocked for now, needs complex historical calculation
    cashReceived,
    cashSpent,
    currentBalance: cashReceived - cashSpent,
    entries: entries.map(e => ({
      ...e,
      recorderName: e.recorder.name
    }))
  };
}

export async function createCashbookEntry(data: any, userId: string) {
  const entry = await prisma.cashbook.create({
    data: {
      amount: data.amount,
      type: data.type,
      date: new Date(data.date),
      category: data.category,
      description: data.description,
      reference: data.reference,
      recorded_by: userId
    }
  });

  await prisma.activityLog.create({
    data: {
      user_id: userId,
      entity_type: "Cashbook",
      entity_id: entry.id,
      action: "CREATE",
      metadata: { amount: entry.amount, type: entry.type }
    }
  });

  return entry;
}
