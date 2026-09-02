import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Password@123", 12);
  await db.user.upsert({
    where: { email: "admin@gmail.com" },
    update: { name: "Admin", role: "ADMIN", passwordHash },
    create: { email: "admin@gmail.com", name: "Admin", role: "ADMIN", passwordHash }
  });
}

main().finally(() => db.$disconnect());
