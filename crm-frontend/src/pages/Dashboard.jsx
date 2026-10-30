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
import { CheckCircle2, Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

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

// Clean Date Formatter (e.g. "Nov 09, 2026")
const formatCleanDate = (dateVal) => {
  if (!dateVal || dateVal === "No date") return "No date";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal).split("T")[0];
    return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  } catch (e) {
    return String(dateVal).split("T")[0];
  }
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

  const taskData = data?.taskSummary || { total: 7, completed: 5, pending: 2, percentage: 71, upcoming: [] };

  return (
    <>
      <PageHeader title="Dashboard" subtitle={subtitle} />

      {isLoading && <LoadingState text="Loading dashboard..." />}
      {isError && <ErrorState message={getErrorMessage(error)} />}

      {data && (
        <>
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {data.stats.map((s) => (
              <StatCard key={s.id} {...s} />
            ))}
          </div>

          {/* Intern 1 Leads Charts */}
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

          {/* Donut & Recent Leads */}
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

          {/* Live Task Execution & Agenda Card */}
          <div className="mt-6 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Task Management & Team Execution</h3>
                  <p className="text-xs text-slate-500">Live operational progress tracked across active sales deals</p>
                </div>
              </div>
              <Link 
                to="/tasks" 
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
              >
                <span>View all tasks</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* Progress Bar Column */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-700">{taskData.completed} of {taskData.total} tasks completed</span>
                  <span className="text-indigo-600 font-bold">{taskData.percentage}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" 
                    style={{ width: `${taskData.percentage}%` }}
                  ></div>
                </div>
                <p className="text-[11px] text-slate-400">
                  {taskData.pending} pending action items remaining
                </p>
              </div>

              {/* Upcoming Tasks Preview */}
              <div className="md:col-span-2 space-y-2">
                {taskData.upcoming && taskData.upcoming.length > 0 ? (
                  taskData.upcoming.map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                          t.priority === 'High' ? 'bg-rose-500' : t.priority === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`} />
                        <span className="font-semibold text-slate-800 truncate">{t.title}</span>
                        {t.deal && <span className="text-[10px] text-slate-400 truncate">({t.deal})</span>}
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 shrink-0 text-[11px]">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{formatCleanDate(t.dueDate)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400 italic py-2">All tasks are currently completed!</div>
                )}
              </div>
            </div>
          </div>

          {/* Intern 1 Recent Activity Feed */}
          <div className="mt-6">
            <ActivityList activities={data.activities} />
          </div>
        </>
      )}
    </>
  );
}