import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import { LoadingState, ErrorState } from "../components/ui/StateMessage";
import LeadsChart from "../components/dashboard/LeadsChart";
import DonutCard from "../components/dashboard/DonutCard";
import RecentLeads from "../components/dashboard/RecentLeads";
import ActivityList from "../components/dashboard/ActivityList";
import { useDashboard } from "../hooks/useDashboard";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../lib/apiClient";

// Status wale rang Badge se mel khate hain
const STATUS_COLORS = {
  New: "#0ea5e9",
  Contacted: "#f59e0b",
  Qualified: "#8b5cf6",
  Won: "#10b981",
  Lost: "#f43f5e",
};

const SOURCE_COLORS = {
  Website: "#6366f1",
  Referral: "#14b8a6",
  LinkedIn: "#3b82f6",
  "Email Campaign": "#f97316",
  Event: "#ec4899",
};

export default function Dashboard() {
  const { user } = useAuth();
  const { data, isLoading, isError, error } = useDashboard();

  const subtitle =
    user?.role === "sales"
      ? "Overview of your leads (contacts are shared with the team)"
      : "Overview of your CRM activity";

  const statusItems = (data?.pipeline ?? []).map((p) => ({ label: p.status, count: p.count }));
  const sourceItems = (data?.sources ?? []).map((s) => ({ label: s.source, count: s.count }));

  return (
    <>
      <PageHeader title="Dashboard" subtitle={subtitle} />

      {isLoading && <LoadingState text="Loading dashboard..." />}
      {isError && <ErrorState message={getErrorMessage(error)} />}

      {data && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {data.stats.map((s) => (
              <StatCard key={s.id} {...s} />
            ))}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <LeadsChart data={data.monthlyLeads} />
            </div>
            <DonutCard
              title="Leads by Status"
              subtitle="Share of leads in each stage"
              items={statusItems}
              colors={STATUS_COLORS}
              centerLabel="Total leads"
            />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <DonutCard
              title="Leads by Source"
              subtitle="Where your leads come from"
              items={sourceItems}
              colors={SOURCE_COLORS}
              centerLabel="Total leads"
            />
            <div className="lg:col-span-2">
              <RecentLeads leads={data.recentLeads} />
            </div>
          </div>

          <div className="mt-6">
            <ActivityList activities={data.activities} />
          </div>
        </>
      )}
    </>
  );
}