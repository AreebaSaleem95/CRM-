import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { loadSeedPasswords } from "./passwords";

const prisma = new PrismaClient();

type SeedRole = "admin" | "manager" | "sales";

const userSeed: { name: string; email: string; role: SeedRole }[] = [
  { name: "Admin User", email: "admin@crm.com", role: "admin" },
  { name: "Manager User", email: "manager@crm.com", role: "manager" },
  { name: "Bint e Zahra", email: "sales@crm.com", role: "sales" },
  { name: "Sara Khan", email: "sara@crm.com", role: "sales" },
  { name: "Usman Tariq", email: "usman@crm.com", role: "sales" },
  { name: "Maria Noor", email: "maria@crm.com", role: "sales" },
];

const leadSeed = [
  { name: "Ali Raza", company: "TechNova", email: "ali@technova.com", phone: "+92 300 1234567", status: "New", source: "Website", value: 12000, owner: "Sara Khan", date: "2026-10-01" },
  { name: "Hina Malik", company: "BrightEdge", email: "hina@brightedge.com", phone: "+92 301 2345678", status: "Contacted", source: "LinkedIn", value: 8500, owner: "Usman Tariq", date: "2026-09-28" },
  { name: "Bilal Ahmed", company: "CloudPeak", email: "bilal@cloudpeak.io", phone: "+92 302 3456789", status: "Qualified", source: "Referral", value: 24000, owner: "Sara Khan", date: "2026-09-25" },
  { name: "Ayesha Siddiqui", company: "GreenLeaf", email: "ayesha@greenleaf.com", phone: "+92 303 4567890", status: "Won", source: "Event", value: 31000, owner: "Usman Tariq", date: "2026-09-20" },
  { name: "Farhan Ali", company: "PixelWorks", email: "farhan@pixelworks.com", phone: "+92 304 5678901", status: "Lost", source: "Email Campaign", value: 5000, owner: "Maria Noor", date: "2026-09-18" },
  { name: "Sana Javed", company: "DataSphere", email: "sana@datasphere.com", phone: "+92 305 6789012", status: "Qualified", source: "Website", value: 18500, owner: "Maria Noor", date: "2026-09-15" },
  { name: "Hamza Sheikh", company: "NextGen Labs", email: "hamza@nextgenlabs.com", phone: "+92 306 7890123", status: "New", source: "LinkedIn", value: 9800, owner: "Sara Khan", date: "2026-09-12" },
  { name: "Noor Fatima", company: "SwiftPay", email: "noor@swiftpay.com", phone: "+92 307 8901234", status: "Contacted", source: "Referral", value: 15200, owner: "Usman Tariq", date: "2026-09-10" },
  { name: "Zain Abbas", company: "UrbanNest", email: "zain@urbannest.com", phone: "+92 308 9012345", status: "Won", source: "Website", value: 27500, owner: "Maria Noor", date: "2026-09-05" },
  { name: "Iqra Hassan", company: "BlueOrbit", email: "iqra@blueorbit.com", phone: "+92 309 0123456", status: "New", source: "Event", value: 7200, owner: "Sara Khan", date: "2026-09-02" },
];

const contactSeed = [
  { name: "Ali Raza", role: "CTO", company: "TechNova", email: "ali@technova.com", phone: "+92 300 1234567", city: "Lahore" },
  { name: "Hina Malik", role: "Marketing Head", company: "BrightEdge", email: "hina@brightedge.com", phone: "+92 301 2345678", city: "Karachi" },
  { name: "Bilal Ahmed", role: "Founder", company: "CloudPeak", email: "bilal@cloudpeak.io", phone: "+92 302 3456789", city: "Islamabad" },
  { name: "Ayesha Siddiqui", role: "Operations Manager", company: "GreenLeaf", email: "ayesha@greenleaf.com", phone: "+92 303 4567890", city: "Lahore" },
  { name: "Farhan Ali", role: "Product Owner", company: "PixelWorks", email: "farhan@pixelworks.com", phone: "+92 304 5678901", city: "Faisalabad" },
  { name: "Sana Javed", role: "Data Lead", company: "DataSphere", email: "sana@datasphere.com", phone: "+92 305 6789012", city: "Karachi" },
  { name: "Hamza Sheikh", role: "Engineering Manager", company: "NextGen Labs", email: "hamza@nextgenlabs.com", phone: "+92 306 7890123", city: "Islamabad" },
  { name: "Noor Fatima", role: "Finance Director", company: "SwiftPay", email: "noor@swiftpay.com", phone: "+92 307 8901234", city: "Lahore" },
  { name: "Zain Abbas", role: "CEO", company: "UrbanNest", email: "zain@urbannest.com", phone: "+92 308 9012345", city: "Gujranwala" },
];

const activitySeed = [
  { user: "Sara Khan", action: "added a new lead: Ali Raza", minutesAgo: 10 },
  { user: "Usman Tariq", action: "moved Bilal Ahmed to Qualified", minutesAgo: 60 },
  { user: "Maria Noor", action: "closed deal with UrbanNest", minutesAgo: 180 },
  { user: "Sara Khan", action: "updated contact: Hina Malik", minutesAgo: 1500 },
  { user: "Usman Tariq", action: "marked Farhan Ali as Lost", minutesAgo: 1600 },
];

async function main() {
  // Seed saara maujooda data delete kar deta hai, live database par kabhi nahi chalna chahiye
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_SEED !== "true") {
    throw new Error(
      "Seeding deletes ALL data and is blocked when NODE_ENV=production. Use 'npm run db:set-passwords' instead."
    );
  }

  const passwords = loadSeedPasswords();

  await prisma.activity.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.user.deleteMany();

  const hashes: Record<SeedRole, string> = {
    admin: await bcrypt.hash(passwords.admin, 10),
    manager: await bcrypt.hash(passwords.manager, 10),
    sales: await bcrypt.hash(passwords.sales, 10),
  };

  const usersByName = new Map<string, number>();

  for (const u of userSeed) {
    const created = await prisma.user.create({
      data: { name: u.name, email: u.email, role: u.role, passwordHash: hashes[u.role] },
    });
    usersByName.set(created.name, created.id);
  }

  for (const l of leadSeed) {
    const { owner, date, ...rest } = l;
    await prisma.lead.create({
      data: {
        ...rest,
        ownerId: usersByName.get(owner)!,
        createdAt: new Date(`${date}T09:00:00.000Z`),
      },
    });
  }

  await prisma.contact.createMany({ data: contactSeed });

  for (const a of activitySeed) {
    await prisma.activity.create({
      data: {
        text: `${a.user} ${a.action}`,
        userId: usersByName.get(a.user)!,
        createdAt: new Date(Date.now() - a.minutesAgo * 60 * 1000),
      },
    });
  }

  console.log("Seed complete. Accounts: admin@crm.com, manager@crm.com, sales@crm.com (passwords are in your .env file).");
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());