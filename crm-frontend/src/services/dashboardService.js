import api, { USE_MOCK } from "../lib/apiClient";
import { delay } from "../lib/mockUtils";
import { getLeads } from "./leadsService";
import { leadStatuses, leadSources } from "../constants/lead";
import { stats, monthlyLeads, activities } from "../data/dashboard";

export async function getDashboard() {
  if (USE_MOCK) {
    await delay();
    const { data: leads } = await getLeads();
    const pipeline = leadStatuses.map((status) => ({
      status,
      count: leads.filter((l) => l.status === status).length,
    }));
    const sources = leadSources.map((source) => ({
      source,
      count: leads.filter((l) => l.source === source).length,
    }));
    const recentLeads = [...leads]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);
    return { stats, monthlyLeads, pipeline, sources, recentLeads, activities };
  }
  const { data } = await api.get("/dashboard");
  return data;
}