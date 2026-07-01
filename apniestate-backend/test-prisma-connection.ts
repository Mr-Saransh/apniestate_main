import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const user = await prisma.user.findFirst()
    console.log('Successfully connected to database!')
    console.log(user ? `Found user: ${user.email}` : 'No users found in database')
  } catch (error) {
    console.error('Failed to connect to database:')
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
