import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import type { RoleName } from "../../types/role";
import { logActivity } from "../activity/activity.service";
import {
  CreateLeadInput,
  LeadSortField,
  ListLeadsQuery,
  SortOrder,
  UpdateLeadInput,
} from "./leads.schema";

export type Actor = { id: number; role: RoleName };

// Sales sirf apni leads dekh aur edit kar sakta hai, manager aur admin sab
export const leadScope = (actor: Actor): Prisma.LeadWhereInput =>
  actor.role === "sales" ? { ownerId: actor.id } : {};

export const leadInclude = { owner: { select: { name: true } } } satisfies Prisma.LeadInclude;

type LeadWithOwner = Prisma.LeadGetPayload<{ include: typeof leadInclude }>;

// Frontend yahi shape expect karta hai: owner = naam (string), date = "YYYY-MM-DD"
export const toLeadDto = (l: LeadWithOwner) => ({
  id: l.id,
  name: l.name,
  company: l.company,
  email: l.email,
  phone: l.phone,
  status: l.status,
  source: l.source,
  value: l.value,
  avatarUrl: l.avatarUrl,
  owner: l.owner.name,
  date: l.createdAt.toISOString().slice(0, 10),
});

// Frontend ke column ka naam -> database ka field
const sortFields = {
  name: (o: SortOrder) => ({ name: o }),
  company: (o: SortOrder) => ({ company: o }),
  status: (o: SortOrder) => ({ status: o }),
  source: (o: SortOrder) => ({ source: o }),
  value: (o: SortOrder) => ({ value: o }),
  owner: (o: SortOrder) => ({ owner: { name: o } }),
  date: (o: SortOrder) => ({ createdAt: o }),
} satisfies Record<LeadSortField, (o: SortOrder) => Prisma.LeadOrderByWithRelationInput>;

function buildOrderBy(sortBy: LeadSortField, order: SortOrder): Prisma.LeadOrderByWithRelationInput[] {
  // id par dobara sort isliye ke barabar values wali rows ki tarteeb har baar ek jaisi rahe
  return [sortFields[sortBy](order), { id: "desc" }];
}

export async function listLeads(query: ListLeadsQuery, actor: Actor) {
  const { search, status, source, page, limit, sortBy, order } = query;

  const where: Prisma.LeadWhereInput = {
    ...leadScope(actor),
    ...(status && { status }),
    ...(source && { source }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const total = await prisma.lead.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / limit));
  // Agar page totalPages se bada ho (jaise last page ki aakhri lead delete hui) to last page de do
  const safePage = Math.min(page, totalPages);

  const rows = await prisma.lead.findMany({
    where,
    include: leadInclude,
    orderBy: buildOrderBy(sortBy, order),
    skip: (safePage - 1) * limit,
    take: limit,
  });

  return { data: rows.map(toLeadDto), total, page: safePage, limit, totalPages };
}

export async function createLead(input: CreateLeadInput, actor: Actor) {
  // Nayi lead ka owner hamesha wahi user hota hai jo usse bana raha hai
  const lead = await prisma.lead.create({
    data: { ...input, ownerId: actor.id },
    include: leadInclude,
  });
  await logActivity(actor.id, `added a new lead: ${lead.name}`);
  return toLeadDto(lead);
}

export async function updateLead(id: number, input: UpdateLeadInput, actor: Actor) {
  // Sales ke liye scope ki wajah se doosre ki lead yahan mil hi nahi sakti
  const existing = await prisma.lead.findFirst({
    where: { id, ...leadScope(actor) },
    select: { id: true },
  });
  if (!existing) throw new ApiError(404, "Lead not found");

  const lead = await prisma.lead.update({
    where: { id },
    data: input,
    include: leadInclude,
  });
  await logActivity(actor.id, `updated lead: ${lead.name}`);
  return toLeadDto(lead);
}

export async function deleteLead(id: number, actor: Actor) {
  const lead = await prisma.lead.findFirst({ where: { id, ...leadScope(actor) } });
  if (!lead) throw new ApiError(404, "Lead not found");
  await prisma.lead.delete({ where: { id } });
  await logActivity(actor.id, `deleted lead: ${lead.name}`);
  return { id };
}