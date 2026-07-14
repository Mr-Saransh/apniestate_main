import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: 'site@gmail.com' }
  });
  if (!user) {
    console.log('User site@gmail.com not found!');
    return;
  }
  console.log('Found user:', user);
  
  const userId = user.id;
  const role = user.role;
  const companyId = user.company_id;
  
  const where = { company_id: companyId, OR: [] };
  where.OR = [
      { builder_id: userId },
      { manager_id: userId },
      {
        sites: {
          some: {
            supervisor_id: userId
          }
        }
      },
      {
        assignments: {
          some: {
            user_id: userId
          }
        }
      }
    ];

  try {
    console.log('Fetching projects with where:', JSON.stringify(where, null, 2));
    const projects = await prisma.project.findMany({
    where,
    include: {
      builder: { select: { id: true, name: true } },
      manager: { select: { id: true, name: true } },
      sites: {
        include: {
          supervisor: { select: { id: true, name: true } }
        }
      },
      tasks: { select: { status: true } },
      milestones: { select: { status: true } },
      _count: { select: { sites: true, tasks: true, milestones: true } }
    },
    orderBy: { created_at: "desc" },
  });
    console.log('Projects count:', projects.length);
  } catch (error) {
    console.error('Error fetching projects:', error);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
