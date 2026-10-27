import { Contact, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { logActivity } from "../activity/activity.service";
import {
  ContactSortField,
  CreateContactInput,
  ListContactsQuery,
  SortOrder,
  UpdateContactInput,
} from "./contacts.schema";

const toContactDto = (c: Contact) => ({
  id: c.id,
  name: c.name,
  role: c.role,
  company: c.company,
  email: c.email,
  phone: c.phone,
  city: c.city,
  avatarUrl: c.avatarUrl,
});

// Frontend ke sort option ka naam -> database ka field
const sortFields = {
  name: (o: SortOrder) => ({ name: o }),
  company: (o: SortOrder) => ({ company: o }),
  role: (o: SortOrder) => ({ role: o }),
  city: (o: SortOrder) => ({ city: o }),
  date: (o: SortOrder) => ({ createdAt: o }),
} satisfies Record<ContactSortField, (o: SortOrder) => Prisma.ContactOrderByWithRelationInput>;

function buildOrderBy(
  sortBy: ContactSortField,
  order: SortOrder
): Prisma.ContactOrderByWithRelationInput[] {
  // id par dobara sort isliye ke barabar values wali rows ki tarteeb har baar ek jaisi rahe
  return [sortFields[sortBy](order), { id: "desc" }];
}

export async function listContacts(query: ListContactsQuery) {
  const { search, city, page, limit, sortBy, order } = query;

  const where: Prisma.ContactWhereInput = {
    ...(city && { city }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const total = await prisma.contact.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);

  const rows = await prisma.contact.findMany({
    where,
    orderBy: buildOrderBy(sortBy, order),
    skip: (safePage - 1) * limit,
    take: limit,
  });

  return { data: rows.map(toContactDto), total, page: safePage, limit, totalPages };
}

export async function listCities() {
  const rows = await prisma.contact.findMany({
    distinct: ["city"],
    select: { city: true },
    orderBy: { city: "asc" },
  });
  return rows.map((r) => r.city);
}

export async function createContact(input: CreateContactInput, userId: number) {
  const contact = await prisma.contact.create({ data: input });
  await logActivity(userId, `added a new contact: ${contact.name}`);
  return toContactDto(contact);
}

export async function updateContact(id: number, input: UpdateContactInput, userId: number) {
  const contact = await prisma.contact.update({ where: { id }, data: input });
  await logActivity(userId, `updated contact: ${contact.name}`);
  return toContactDto(contact);
}

export async function deleteContact(id: number, userId: number) {
  const contact = await prisma.contact.findUnique({ where: { id } });
  if (!contact) throw new ApiError(404, "Contact not found");
  await prisma.contact.delete({ where: { id } });
  await logActivity(userId, `deleted contact: ${contact.name}`);
  return { id };
}