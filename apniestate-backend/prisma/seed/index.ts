import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("admin123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@apniestate.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@apniestate.com",
      password_hash: hash,
      role: "BUILDER",
    },
  });

  console.log("Seeded admin:", admin.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
