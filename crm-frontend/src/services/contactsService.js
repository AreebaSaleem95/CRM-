import api, { USE_MOCK } from "../lib/apiClient";
import { delay } from "../lib/mockUtils";
import { contacts as seed } from "../data/contacts";

let mockContacts = [...seed];

const sortGetters = {
  name: (c) => c.name.toLowerCase(),
  company: (c) => c.company.toLowerCase(),
  role: (c) => c.role.toLowerCase(),
  city: (c) => c.city.toLowerCase(),
  // Mock contacts mein date nahi hoti, naye contacts ka id bada hota hai
  date: (c) => c.id,
};

export async function getContacts(params = {}) {
  if (USE_MOCK) {
    await delay();
    const q = (params.search || "").trim().toLowerCase();

    const filtered = mockContacts.filter((c) => {
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q);
      const matchesCity = !params.city || c.city === params.city;
      return matchesSearch && matchesCity;
    });

    const sortBy = sortGetters[params.sortBy] ? params.sortBy : "date";
    const dir = params.order === "asc" ? 1 : -1;
    const get = sortGetters[sortBy];
    const sorted = [...filtered].sort((a, b) => {
      const av = get(a);
      const bv = get(b);
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return b.id - a.id;
    });

    // limit na ho to sab contacts
    if (!params.limit) {
      return { data: sorted, total: sorted.length, page: 1, limit: sorted.length, totalPages: 1 };
    }

    const limit = Number(params.limit);
    const totalPages = Math.max(1, Math.ceil(sorted.length / limit));
    const page = Math.min(Math.max(1, Number(params.page) || 1), totalPages);
    const start = (page - 1) * limit;

    return {
      data: sorted.slice(start, start + limit),
      total: sorted.length,
      page,
      limit,
      totalPages,
    };
  }

  const { data } = await api.get("/contacts", { params });
  return data;
}

export async function getCities() {
  if (USE_MOCK) {
    await delay(150);
    return [...new Set(mockContacts.map((c) => c.city))].sort();
  }
  const { data } = await api.get("/contacts/cities");
  return data;
}

export async function createContact(payload) {
  if (USE_MOCK) {
    await delay();
    const contact = { ...payload, id: Date.now() };
    mockContacts = [contact, ...mockContacts];
    return contact;
  }
  const { data } = await api.post("/contacts", payload);
  return data;
}

export async function updateContact(id, payload) {
  if (USE_MOCK) {
    await delay();
    mockContacts = mockContacts.map((c) => (c.id === id ? { ...c, ...payload } : c));
    return mockContacts.find((c) => c.id === id);
  }
  const { data } = await api.patch(`/contacts/${id}`, payload);
  return data;
}

export async function deleteContact(id) {
  if (USE_MOCK) {
    await delay();
    mockContacts = mockContacts.filter((c) => c.id !== id);
    return { id };
  }
  const { data } = await api.delete(`/contacts/${id}`);
  return data;
}