import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { timeAgo } from "../../utils/timeAgo";
import { leadSources, leadStatuses } from "../leads/leads.schema";
import { Actor, leadInclude, leadScope, toLeadDto } from "../leads/leads.service";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const monthStart = (year: number, month: number) => new Date(Date.UTC(year, month, 1));
const inRange = (gte: Date, lt: Date) => ({ createdAt: { gte, lt } });
const money = (n: number) => `Rs${Math.round(n).toLocaleString("en-US")}`;

// Is mahine vs pichle mahine ka percentage change.
// Agar pichle mahine ki value 0 ho: current > 0 to "+100%", warna "0%".
function change(current: number, previous: number) {
  if (previous === 0) {
    return { text: current > 0 ? "+100%" : "0%", positive: true };
  }
  const pct = ((current - previous) / previous) * 100;
  return { text: `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`, positive: pct >= 0 };
}

export async function getDashboard(actor: Actor) {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const thisStart = monthStart(y, m);
  const prevStart = monthStart(y, m - 1);
  const nextStart = monthStart(y, m + 1);
  const sixStart = monthStart(y, m - 5);

  // Sales ke liye sirf apni leads, manager/admin ke liye sab
  const scope = leadScope(actor);
  // Activity: sales ko sirf apni, manager/admin ko sab ki
  const activityWhere: Prisma.ActivityWhereInput = actor.role === "sales" ? { userId: actor.id } : {};

  const [
    totalLeads, leadsThis, leadsPrev,
    totalContacts, contactsThis, contactsPrev,
    wonAll, wonThis, wonPrev,
    monthRows, pipelineRows, sourceRows, recent, activityRows,
  ] = await Promise.all([
    prisma.lead.count({ where: scope }),
    prisma.lead.count({ where: { ...scope, ...inRange(thisStart, nextStart) } }),
    prisma.lead.count({ where: { ...scope, ...inRange(prevStart, thisStart) } }),
    // Contacts sab roles ke liye shared hain (Contact table mein owner nahi hai)
    prisma.contact.count(),
    prisma.contact.count({ where: inRange(thisStart, nextStart) }),
    prisma.contact.count({ where: inRange(prevStart, thisStart) }),
    prisma.lead.aggregate({ where: { ...scope, status: "Won" }, _count: { _all: true }, _sum: { value: true } }),
    prisma.lead.aggregate({ where: { ...scope, status: "Won", ...inRange(thisStart, nextStart) }, _count: { _all: true }, _sum: { value: true } }),
    prisma.lead.aggregate({ where: { ...scope, status: "Won", ...inRange(prevStart, thisStart) }, _count: { _all: true }, _sum: { value: true } }),
    prisma.lead.findMany({ where: { ...scope, createdAt: { gte: sixStart } }, select: { createdAt: true } }),
    prisma.lead.groupBy({ where: scope, by: ["status"], _count: { _all: true } }),
    prisma.lead.groupBy({ where: scope, by: ["source"], _count: { _all: true } }),
    prisma.lead.findMany({ where: scope, include: leadInclude, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 5 }),
    prisma.activity.findMany({ where: activityWhere, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  const leadsChange = change(leadsThis, leadsPrev);
  const contactsChange = change(contactsThis, contactsPrev);
  const wonChange = change(wonThis._count._all, wonPrev._count._all);
  const revenueChange = change(wonThis._sum.value ?? 0, wonPrev._sum.value ?? 0);

  const stats = [
    { id: 1, title: "Total Leads", value: totalLeads.toLocaleString("en-US"), change: leadsChange.text, positive: leadsChange.positive, icon: "leads" },
    { id: 2, title: "Total Contacts", value: totalContacts.toLocaleString("en-US"), change: contactsChange.text, positive: contactsChange.positive, icon: "contacts" },
    { id: 3, title: "Deals Won", value: wonAll._count._all.toLocaleString("en-US"), change: wonChange.text, positive: wonChange.positive, icon: "won" },
    { id: 4, title: "Revenue", value: money(wonAll._sum.value ?? 0), change: revenueChange.text, positive: revenueChange.positive, icon: "revenue" },
  ];

  const monthlyLeads = Array.from({ length: 6 }, (_, i) => {
    const d = monthStart(y, m - 5 + i);
    const count = monthRows.filter(
      (r) =>
        r.createdAt.getUTCFullYear() === d.getUTCFullYear() &&
        r.createdAt.getUTCMonth() === d.getUTCMonth()
    ).length;
    return { month: MONTHS[d.getUTCMonth()], count };
  });

  const pipeline = leadStatuses.map((status) => ({
    status,
    count: pipelineRows.find((r) => r.status === status)?._count._all ?? 0,
  }));

  // Har source ki leads ki ginti (0 wale sources bhi list mein aate hain)
  const sources = leadSources.map((source) => ({
    source,
    count: sourceRows.find((r) => r.source === source)?._count._all ?? 0,
  }));

  return {
    stats,
    monthlyLeads,
    pipeline,
    sources,
    recentLeads: recent.map(toLeadDto),
    activities: activityRows.map((a) => ({ id: a.id, text: a.text, time: timeAgo(a.createdAt) })),
  };
}