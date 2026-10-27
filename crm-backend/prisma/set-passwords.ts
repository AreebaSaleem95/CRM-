import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { loadSeedPasswords } from "./passwords";

const prisma = new PrismaClient();

const accounts = [
  { name: "Admin User", email: "admin@crm.com", role: "admin" as const },
  { name: "Manager User", email: "manager@crm.com", role: "manager" as const },
  { name: "Bint e Zahra", email: "sales@crm.com", role: "sales" as const },
];

// Seed ke baqi demo sales users, agar maujood hon to unka password bhi badal jayega
const extraSalesEmails = ["sara@crm.com", "usman@crm.com", "maria@crm.com"];

async function main() {
  const passwords = loadSeedPasswords();

  for (const acc of accounts) {
    const passwordHash = await bcrypt.hash(passwords[acc.role], 10);
    await prisma.user.upsert({
      where: { email: acc.email },
      update: { passwordHash },
      create: { name: acc.name, email: acc.email, role: acc.role, passwordHash },
    });
    console.log(`Password set for ${acc.email} (${acc.role})`);
  }

  const salesHash = await bcrypt.hash(passwords.sales, 10);
  const extra = await prisma.user.updateMany({
    where: { email: { in: extraSalesEmails } },
    data: { passwordHash: salesHash },
  });
  console.log(`Password set for ${extra.count} extra sales user(s)`);

  // Purane login tokens hata do, taake purani sessions khatam ho jayein
  const revoked = await prisma.refreshToken.deleteMany();
  console.log(`Logged out ${revoked.count} old session(s)`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());