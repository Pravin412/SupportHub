import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("SupportHub123!", 12);
  const admin = await db.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: { email: "admin@example.com", name: "Admin", role: "ADMIN", passwordHash }
  });
  const secretHash = await bcrypt.hash("dev-integration-secret", 12);
  const project = await db.project.upsert({
    where: { key: "teledoctor" },
    update: {},
    create: { name: "TeleDoctor", key: "teledoctor", integrationKey: "dev-key", integrationSecretHash: secretHash }
  });
  await db.projectMember.upsert({
    where: { projectId_userId: { projectId: project.id, userId: admin.id } },
    update: {},
    create: { projectId: project.id, userId: admin.id, role: "ADMIN" }
  });
}

main().finally(() => db.$disconnect());
