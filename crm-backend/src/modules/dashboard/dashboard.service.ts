import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { pool } from "../../config/db";
import { timeAgo } from "../../utils/timeAgo";
import { leadSources, leadStatuses } from "../leads/leads.schema";
import { Actor, leadInclude, leadScope, toLeadDto } from "../leads/leads.service";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const monthStart = (year: number, month: number) => new Date(Date.UTC(year, month, 1));
const inRange = (gte: Date, lt: Date) => ({ createdAt: { gte, lt } });
const money = (n: number) => `Rs${Math.round(n).toLocaleString("en-US")}`;

function change(current: number, previous: number) {
  if (previous === 0) {
    return { text: current > 0 ? "+100%" : "0%", positive: true };
  }
  const pct = ((current - previous) / previous) * 100;
  return { text: `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`, positive: pct >= 0 };
}

function formatTaskCleanDate(dateVal: any): string {
  if (!dateVal) return "No date";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "No date";
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

export async function getDashboard(actor: Actor) {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const thisStart = monthStart(y, m);
  const prevStart = monthStart(y, m - 1);
  const nextStart = monthStart(y, m + 1);
  const sixStart = monthStart(y, m - 5);

  const scope = leadScope(actor);
  const activityWhere: Prisma.ActivityWhereInput = actor.role === "sales" ? { userId: actor.id } : {};
  const isExecutive = ['admin', 'manager', 'ceo', 'cfo'].includes(String(actor.role || '').toLowerCase());

  // 1. Leads, Contacts & Activities
  const [
    totalLeads, leadsThis, leadsPrev,
    totalContacts, contactsThis, contactsPrev,
    wonLeadsAll, wonLeadsThis, wonLeadsPrev,
    monthRows, pipelineRows, sourceRows, recent, activityRows,
  ] = await Promise.all([
    prisma.lead.count({ where: scope }),
    prisma.lead.count({ where: { ...scope, ...inRange(thisStart, nextStart) } }),
    prisma.lead.count({ where: { ...scope, ...inRange(prevStart, thisStart) } }),
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

  // 2. Deals Pipeline Data (Role Filtered)
  let dealsWonCount = 0;
  let dealsWonValue = 0;
  let dealsWonThisMonth = 0;
  let dealsWonPrevMonth = 0;
  let dealsRevenueThisMonth = 0;
  let dealsRevenuePrevMonth = 0;
  let totalDealsCount = 0;
  let activeDealsCount = 0;

  try {
    const dealsQuery = isExecutive
      ? `SELECT id, value, stage, created_at, expected_close, closing_date FROM public.deals`
      : `SELECT id, value, stage, created_at, expected_close, closing_date FROM public.deals WHERE user_id = $1`;
    const dealsParams = isExecutive ? [] : [actor.id];

    const dealsRes = await pool.query(dealsQuery, dealsParams);

    const allDeals = dealsRes.rows || [];
    totalDealsCount = allDeals.length;

    const wonDeals = allDeals.filter((d: any) =>
      ['won', 'won / closed', 'closed won'].includes(String(d.stage || '').toLowerCase())
    );

    activeDealsCount = totalDealsCount - wonDeals.length;
    dealsWonCount = wonDeals.length;
    dealsWonValue = wonDeals.reduce((acc: number, d: any) => acc + (Number(d.value) || 0), 0);

    wonDeals.forEach((d: any) => {
      const dateVal = d.closing_date || d.expected_close || d.created_at;
      if (dateVal) {
        const dt = new Date(dateVal);
        const val = Number(d.value) || 0;
        if (dt >= thisStart && dt < nextStart) {
          dealsWonThisMonth += 1;
          dealsRevenueThisMonth += val;
        } else if (dt >= prevStart && dt < thisStart) {
          dealsWonPrevMonth += 1;
          dealsRevenuePrevMonth += val;
        }
      }
    });
  } catch (err) {
    console.warn("Deals table query skipped:", err);
  }

  // 3. Tasks Execution Data (Role Filtered)
  let totalTasks = 0;
  let completedTasks = 0;
  let pendingTasks = 0;
  let upcomingTasksList: any[] = [];

  try {
    const tasksQuery = isExecutive
      ? `SELECT id, title, status, priority, due_date, related_deal FROM public.tasks ORDER BY due_date ASC NULLS LAST`
      : `SELECT id, title, status, priority, due_date, related_deal FROM public.tasks WHERE user_id = $1 ORDER BY due_date ASC NULLS LAST`;
    const tasksParams = isExecutive ? [] : [actor.id];

    const tasksRes = await pool.query(tasksQuery, tasksParams);
    const allTasks = tasksRes.rows || [];
    totalTasks = allTasks.length;
    completedTasks = allTasks.filter((t: any) => 
      ['completed', 'done', 'true'].includes(String(t.status || '').toLowerCase())
    ).length;
    pendingTasks = totalTasks - completedTasks;

    upcomingTasksList = allTasks
      .filter((t: any) => !['completed', 'done', 'true'].includes(String(t.status || '').toLowerCase()))
      .slice(0, 3)
      .map((t: any) => ({
        id: t.id,
        title: t.title,
        priority: t.priority || 'Medium',
        dueDate: formatTaskCleanDate(t.due_date),
        deal: t.related_deal || ''
      }));
  } catch (err) {
    console.warn("Tasks table query skipped:", err);
  }

  // Combined Numbers
  const combinedWonAll = (wonLeadsAll._count._all || 0) + dealsWonCount;
  const combinedRevenueAll = (wonLeadsAll._sum.value || 0) + dealsWonValue;

  const combinedWonThis = (wonLeadsThis._count._all || 0) + dealsWonThisMonth;
  const combinedWonPrev = (wonLeadsPrev._count._all || 0) + dealsWonPrevMonth;

  const combinedRevenueThis = (wonLeadsThis._sum.value || 0) + dealsRevenueThisMonth;
  const combinedRevenuePrev = (wonLeadsPrev._sum.value || 0) + dealsRevenuePrevMonth;

  const leadsChange = change(leadsThis, leadsPrev);
  const contactsChange = change(contactsThis, contactsPrev);
  const wonChange = change(combinedWonThis, combinedWonPrev);
  const revenueChange = change(combinedRevenueThis, combinedRevenuePrev);

  const stats = [
    { id: 1, title: "Total Leads", value: totalLeads.toLocaleString("en-US"), change: leadsChange.text, positive: leadsChange.positive, icon: "leads" },
    { id: 2, title: "Total Contacts", value: totalContacts.toLocaleString("en-US"), change: contactsChange.text, positive: contactsChange.positive, icon: "contacts" },
    { id: 3, title: "Deals Won", value: combinedWonAll.toLocaleString("en-US"), change: wonChange.text, positive: wonChange.positive, icon: "won" },
    { id: 4, title: "Revenue", value: money(combinedRevenueAll), change: revenueChange.text, positive: revenueChange.positive, icon: "revenue" },
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
    taskSummary: {
      total: totalTasks,
      completed: completedTasks,
      pending: pendingTasks,
      percentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      upcoming: upcomingTasksList
    },
    pipelineSummary: {
      totalDeals: totalDealsCount,
      activeDeals: activeDealsCount,
      wonDeals: dealsWonCount
    }
  };
}

// 4. Global Search Handler (Strictly Role-Scoped by User / Actor)
export async function searchGlobal(q: string, actor?: Actor) {
  if (!q || q.trim().length === 0) {
    return { leads: [], contacts: [], deals: [], tasks: [] };
  }
  const term = q.trim();
  const isExecutive = ['admin', 'manager', 'ceo', 'cfo'].includes(String(actor?.role || '').toLowerCase());
  const scope = actor ? leadScope(actor) : {};

  // Search Leads (Filtered by Owner) & Contacts (Global Directory)
  let leads: any[] = [];
  let contacts: any[] = [];
  try {
    [leads, contacts] = await Promise.all([
      prisma.lead.findMany({
        where: {
          ...scope,
          OR: [
            { name: { contains: term, mode: "insensitive" } },
            { company: { contains: term, mode: "insensitive" } },
            { email: { contains: term, mode: "insensitive" } }
          ]
        },
        take: 4,
        select: { id: true, name: true, company: true, status: true }
      }),
      prisma.contact.findMany({
        where: {
          OR: [
            { name: { contains: term, mode: "insensitive" } },
            { email: { contains: term, mode: "insensitive" } }
          ]
        },
        take: 4,
        select: { id: true, name: true, email: true }
      })
    ]);
  } catch (e) {
    console.error("Prisma search error:", e);
  }

  // Search Deals & Tasks (Filtered by User ID for Sales Reps)
  let deals: any[] = [];
  let tasks: any[] = [];
  try {
    const dealsQuery = isExecutive
      ? `SELECT id, title, company, stage, value FROM public.deals 
         WHERE CAST(title AS TEXT) ILIKE $1 OR CAST(company AS TEXT) ILIKE $1 LIMIT 4`
      : `SELECT id, title, company, stage, value FROM public.deals 
         WHERE user_id = $2 AND (CAST(title AS TEXT) ILIKE $1 OR CAST(company AS TEXT) ILIKE $1) LIMIT 4`;
    const dealsParams = isExecutive ? [`%${term}%`] : [`%${term}%`, actor?.id];

    const tasksQuery = isExecutive
      ? `SELECT id, title, priority, status, related_deal FROM public.tasks 
         WHERE CAST(title AS TEXT) ILIKE $1 OR CAST(related_deal AS TEXT) ILIKE $1 LIMIT 4`
      : `SELECT id, title, priority, status, related_deal FROM public.tasks 
         WHERE user_id = $2 AND (CAST(title AS TEXT) ILIKE $1 OR CAST(related_deal AS TEXT) ILIKE $1) LIMIT 4`;
    const tasksParams = isExecutive ? [`%${term}%`] : [`%${term}%`, actor?.id];

    const [dealsRes, tasksRes] = await Promise.all([
      pool.query(dealsQuery, dealsParams),
      pool.query(tasksQuery, tasksParams)
    ]);
    deals = dealsRes.rows || [];
    tasks = tasksRes.rows || [];
  } catch (err) {
    console.error("Postgres pool search error:", err);
  }

  return { leads, contacts, deals, tasks };
}

// 5. Notifications Handler (Role-Isolated Tasks & Activities)
export async function getNotifications(actor: Actor) {
  const isExecutive = ['admin', 'manager', 'ceo', 'cfo'].includes(String(actor.role || '').toLowerCase());
  let pendingTasks: any[] = [];
  try {
    const tasksQuery = isExecutive
      ? `SELECT id, title, priority, due_date, related_deal, status FROM public.tasks WHERE status != 'Completed' ORDER BY due_date ASC NULLS LAST LIMIT 5`
      : `SELECT id, title, priority, due_date, related_deal, status FROM public.tasks WHERE user_id = $1 AND status != 'Completed' ORDER BY due_date ASC NULLS LAST LIMIT 5`;
    const tasksParams = isExecutive ? [] : [actor.id];

    const tasksRes = await pool.query(tasksQuery, tasksParams);

    const allTasks = tasksRes.rows || [];
    pendingTasks = allTasks.map((t: any) => ({
      id: `task-${t.id}`,
      type: "task",
      title: t.title,
      subtitle: `${t.priority || 'Medium'} Priority • ${t.related_deal || 'Deal Follow-up'}`,
      time: formatTaskCleanDate(t.due_date),
      link: "/tasks"
    }));
  } catch (e) {
    console.error("Tasks notifications query error:", e);
  }

  let activityNotifications: any[] = [];
  try {
    const activityWhere: Prisma.ActivityWhereInput = isExecutive ? {} : { userId: actor.id };
    const recentActivities = await prisma.activity.findMany({
      where: activityWhere,
      orderBy: { createdAt: "desc" },
      take: 4
    });

    activityNotifications = recentActivities.map((a) => ({
      id: `act-${a.id}`,
      type: "activity",
      title: a.text,
      subtitle: "CRM System Update",
      time: timeAgo(a.createdAt),
      link: "/leads"
    }));
  } catch (e) {
    console.error("Activity notifications error:", e);
  }

  return [...pendingTasks, ...activityNotifications];
}