import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const attendance = await prisma.workerAttendance.count();
  const expenses = await prisma.expense.count();
  const invoices = await prisma.invoice.count();
  console.log('Attendance:', attendance);
  console.log('Expenses:', expenses);
  console.log('Invoices:', invoices);
}
main().finally(() => prisma.$disconnect());
