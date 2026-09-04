import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();
const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim() || "admin@gmail.com";
const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Password@123";

async function main() {
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const admin = await db.user.upsert({
    where: { email: adminEmail },
    update: { name: "Admin", role: "ADMIN", passwordHash },
    create: { email: adminEmail, name: "Admin", role: "ADMIN", passwordHash }
  });

  console.log(`Seed completed successfully.`);
  console.log(`Admin login email: ${admin.email}`);
  console.log(`Admin role: ${admin.role}`);
}

main()
  .catch((error) => {
    console.error("Seed failed.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
