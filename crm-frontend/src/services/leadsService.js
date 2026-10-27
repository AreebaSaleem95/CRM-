import api, { USE_MOCK } from "../lib/apiClient";
import { delay } from "../lib/mockUtils";
import { leads as seed } from "../data/leads";

let mockLeads = [...seed];

const sortGetters = {
  name: (l) => l.name.toLowerCase(),
  company: (l) => l.company.toLowerCase(),
  status: (l) => l.status,
  source: (l) => l.source,
  value: (l) => l.value,
  owner: (l) => (l.owner || "").toLowerCase(),
  date: (l) => l.date,
};

export async function getLeads(params = {}) {
  if (USE_MOCK) {
    await delay();
    const q = (params.search || "").trim().toLowerCase();

    const filtered = mockLeads.filter((l) => {
      const matchesSearch =
        !q ||
        l.name.toLowerCase().includes(q) ||
        l.company.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q);
      const matchesStatus = !params.status || l.status === params.status;
      const matchesSource = !params.source || l.source === params.source;
      return matchesSearch && matchesStatus && matchesSource;
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

    // limit na ho to sab leads (mock dashboard yahi use karta hai)
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

  const { data } = await api.get("/leads", { params });
  return data;
}

export async function createLead(payload) {
  if (USE_MOCK) {
    await delay();
    const lead = {
      ...payload,
      id: Date.now(),
      owner: JSON.parse(localStorage.getItem("mockUser") || "{}").name || "You",
      date: new Date().toISOString().slice(0, 10),
    };
    mockLeads = [lead, ...mockLeads];
    return lead;
  }
  const { data } = await api.post("/leads", payload);
  return data;
}

export async function updateLead(id, payload) {
  if (USE_MOCK) {
    await delay();
    mockLeads = mockLeads.map((l) => (l.id === id ? { ...l, ...payload } : l));
    return mockLeads.find((l) => l.id === id);
  }
  const { data } = await api.patch(`/leads/${id}`, payload);
  return data;
}

export async function deleteLead(id) {
  if (USE_MOCK) {
    await delay();
    mockLeads = mockLeads.filter((l) => l.id !== id);
    return { id };
  }
  const { data } = await api.delete(`/leads/${id}`);
  return data;
}